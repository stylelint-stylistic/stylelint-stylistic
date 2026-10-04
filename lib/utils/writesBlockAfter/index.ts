import type { Container, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LEADING_CSS_WHITESPACE, LINE_BREAK } from "../../regexps.ts"
import { beforeBlockString } from "../beforeBlockString/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { neighborCopies, type NeighborRuleSetting, speaksOf } from "../neighborSettings/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { straySemicolonsTaken, withoutTaken } from "../straySemicolonsTaken/index.ts"
import { isComment, isRule } from "../typeGuards/index.ts"

/** A spelling of the whitespace run in front of a closing brace. */
type Run = `newline` | `emptyLine` | `space` | `none` | `other`

/** What a break rule's `always` accepts. */
const OPENS_WITH_A_BREAK: Run[] = [`newline`, `emptyLine`]

/** What `block-closing-brace-empty-line-before` accepts where it wants no empty line. */
const WITHOUT_AN_EMPTY_LINE: Run[] = [`newline`, `space`, `none`, `other`]

/** The rule about a break in front of the closing brace. */
const CLOSING_NEWLINE: NeighborRuleSetting = {
	name: `block-closing-brace-newline-before`,
	options: [`always`, `always-multi-line`, `never-multi-line`],
}

/** The rule about a space in front of the closing brace. */
const CLOSING_SPACE: NeighborRuleSetting = {
	name: `block-closing-brace-space-before`,
	options: [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
}

/** The rule about an empty line in front of the closing brace. */
const CLOSING_EMPTY_LINE: NeighborRuleSetting = {
	name: `block-closing-brace-empty-line-before`,
	options: [`always-multi-line`, `never`],
}

/** The rule whose run in front of a closing brace is the run behind the opening brace, and the primaries it accepts. */
const OPENING_NEWLINE: NeighborRuleSetting = {
	name: `block-opening-brace-newline-after`,
	options: [`always`, `always-multi-line`, `never-multi-line`],
}

/**
 * The runs a whitespace option accepts: `always` what its rule writes, `never` no whitespace at all.
 * @param option - The primary option, `always` or `never` with any line suffix.
 * @param writesABreak - Whether the rule's `always` writes a break rather than a space.
 * @returns The accepted spellings.
 */
function acceptedByWhitespace (option: string, writesABreak: boolean): Run[] {
	if (!option.startsWith(`always`)) return [`none`]

	return writesABreak ? OPENS_WITH_A_BREAK : [`space`]
}

/**
 * Finds the line the character behind a statement's opening brace stands on, which is where `block-opening-brace-newline-after` reports the run in front of a block's closing brace: a disable comment is asked about that line and not about the line a head standing above the brace opens on.
 * @param node - The block's statement.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The line, or nothing where the file does not tell it.
 */
function openingBraceLine (node: Container, result: PostcssResult): number | undefined {
	let start = node.source?.start?.line

	if (start === undefined) return undefined

	return start + (beforeBlockString(node, result, { noRawBefore: true }).match(EVERY_LINE_BREAK)?.length ?? 0)
}

/**
 * Asks whether `block-opening-brace-newline-after` leaves a copy of `never-multi-line` no room for an empty line in front of this block's closing brace.
 *
 * The neighbor writes the run in front of the closing brace of a block holding one node or nothing but comments ([lib/rules/block-opening-brace-newline-after/index.ts](../../../lib/rules/block-opening-brace-newline-after/index.ts)), and only the second form is asked here: a block holding one node holds a declaration or a nested rule, and {@link keepsAnEmptyLineBeforeBrace} asks for no empty line in either. `never-multi-line` leaves no whitespace of a multi-line block there, and an empty line is two breaks of the run, so no file satisfies both.
 *
 * A turned-off fix changes nothing about the claim: the neighbor still reports a break standing there and takes none out, so its copy is asked with the others. `ignore: ["rules"]` takes it off the rules alone, its at-rule walk standing whatever the option says. A disable comment, on the other hand, takes the report away, and a rule that reports nothing forbids nothing.
 * @param node - The block's statement.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True where no copy of the neighbor leaves the empty line standing.
 */
function refusedByOpeningBrace (node: Container, result: PostcssResult): boolean {
	// An empty block is out of both questions before either of them is asked, so the children stand for a block holding at least one
	if (!(node.nodes ?? []).every((child) => isComment(child))) return false

	let line = openingBraceLine(node, result)

	return neighborCopies(node, result, OPENING_NEWLINE).some(({ option, secondary, name }) => option === `never-multi-line`
		&& (!isRule(node) || !optionsMatches(secondary, `ignore`, `rules`))
		&& (line === undefined || !fixDisabledOnLine(result, name, line)))
}

/**
 * Asks whether `block-closing-brace-empty-line-before` leaves an empty line in the run in front of a block's closing brace.
 *
 * The rule always judges, and only its expectation moves: `except: after-closing-brace` reverses the option for a block holding no declaration, and otherwise `always-multi-line` wants the line in a multi-line block alone. The reversal asks for the line unconditionally, which it may not do where the run is the one `block-opening-brace-newline-after` writes: no file satisfies both, so the rule asks for nothing and the neighbor is free to write. The neighbor is asked with its turn not yet come and with it come, so the answer is one file either way.
 *
 * The rule and the gate below read this one answer, which is what keeps a promise made to the neighbor and a decision made by the rule from drifting apart.
 * @param node - The block's statement.
 * @param result - The Stylelint result, which holds the configuration.
 * @param option - The empty line rule's primary option.
 * @param secondary - Its secondary options.
 * @param isSingleLine - Whether the block is one line as the asking side leaves it.
 * @returns True where the empty line stands.
 */
export function keepsAnEmptyLineBeforeBrace (node: Container, result: PostcssResult, option: string, secondary: Record<string, unknown>, isSingleLine: boolean): boolean {
	if (optionsMatches(secondary, `except`, `after-closing-brace`) && !(node.nodes ?? []).some((child) => child.type === `decl`)) return option === `never` && !refusedByOpeningBrace(node, result)

	return option === `always-multi-line` && !isSingleLine
}

/**
 * The runs {@link keepsAnEmptyLineBeforeBrace} accepts of the run in front of the closing brace.
 * @param node - The block's statement.
 * @param result - The Stylelint result, which holds the configuration.
 * @param option - The empty line rule's primary option.
 * @param secondary - Its secondary options.
 * @param isSingleLine - Whether the block is one line as the asking side leaves it.
 * @returns The accepted spellings.
 */
function acceptedByEmptyLine (node: Container, result: PostcssResult, option: string, secondary: Record<string, unknown>, isSingleLine: boolean): Run[] {
	return keepsAnEmptyLineBeforeBrace(node, result, option, secondary, isSingleLine) ? [`emptyLine`] : WITHOUT_AN_EMPTY_LINE
}

/**
 * Reads the copies of a neighbor that are listed with an option they accept and a fix that would rewrite the run.
 * @param node - A node of the root the rules read.
 * @param result - The Stylelint result, which holds the configuration.
 * @param rule - The neighbor and the primaries it accepts.
 * @returns The primary and the secondaries per writing copy, none where the neighbor gates nothing.
 */
function writingCopies (node: Node, result: PostcssResult, rule: NeighborRuleSetting): { option: string, secondary: Record<string, unknown> }[] {
	// A turned-off fix rewrites nothing, so it gates nothing
	return neighborCopies(node, result, rule).flatMap(({ option, fixDisabled, secondary }) => !fixDisabled && typeof option === `string` ? [{ option, secondary }] : [])
}

/**
 * Asks whether `block-opening-brace-newline-after` is the one to write the run in front of the closing brace of a block holding nothing but comments, the run the three `block-closing-brace-*-before` rules write.
 *
 * It writes only where every one of the three that speaks of the block as the write leaves it accepts a spelling it accepts too; otherwise the run would be taken straight back out, and the two rules would take it in turns for as long as `--fix` ran. Sharing a spelling rather than accepting the written one is what lets `block-closing-brace-empty-line-before` double the break this rule writes.
 *
 * A run holding a stray semicolon no neighbor takes out is two runs: the asking rule writes the whitespace in front of the first such semicolon, and the three write the whitespace in front of the brace. Only a neighbor that may take back what the asking rule writes there is asked then: `block-closing-brace-newline-before` under `never-multi-line`, which takes every break of the run out, and, where no break stands behind the first semicolon, its other options and `block-closing-brace-empty-line-before`, which may then put their break in front of it. Where a break stands behind it, they accept either spelling the asking rule writes in front. `block-closing-brace-space-before` writes behind the last semicolon alone.
 *
 * Run order is not asked: one rule asks and the three write whatever the configuration lists, so no order changes the answer. The copy of each of the three reading the root is asked.
 * @param node - The block's statement, a node of the root the rules read.
 * @param result - The Stylelint result, which holds the configuration.
 * @param primary - The asking rule's primary option.
 * @param isSingleLine - Whether the block is one line as the write leaves it.
 * @param standing - The run in front of the closing brace as it stands.
 * @returns True where the asking rule writes the run.
 */
export function writesBlockAfter (node: Container, result: PostcssResult, primary: string, isSingleLine: boolean, standing: string): boolean {
	let accepted = acceptedByWhitespace(primary, true)
	let left = withoutTaken(standing, straySemicolonsTaken(node, result))
	let head = left.match(LEADING_CSS_WHITESPACE)?.[0] ?? ``
	let holdsCode = head.length < left.length
	// Where a break stands anywhere behind the first code, the neighbors putting theirs in front of the run find one
	let writtenInFront = !holdsCode || !LINE_BREAK.test(left.slice(head.length))

	/**
	 * Asks whether a neighbor leaves the asking rule a spelling they both accept.
	 * @param neighborAccepts - The spellings the neighbor accepts.
	 * @returns True where the two sets meet.
	 */
	function agrees (neighborAccepts: Run[]): boolean {
		return neighborAccepts.some((run) => accepted.includes(run))
	}

	if (writingCopies(node, result, CLOSING_NEWLINE).some(({ option }) => (writtenInFront || option === `never-multi-line`) && speaksOf(option, () => isSingleLine) && !agrees(acceptedByWhitespace(option, true)))) return false

	if (!holdsCode && writingCopies(node, result, CLOSING_SPACE).some(({ option }) => speaksOf(option, () => isSingleLine) && !agrees(acceptedByWhitespace(option, false)))) return false

	return !writtenInFront || writingCopies(node, result, CLOSING_EMPTY_LINE).every(({ option, secondary }) => agrees(acceptedByEmptyLine(node, result, option, secondary, isSingleLine)))
}
