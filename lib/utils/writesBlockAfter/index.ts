import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { neighborCopies, type NeighborRuleSetting, speaksOf } from "../neighborSettings/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"

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
 * The runs `block-closing-brace-empty-line-before` accepts of a block holding nothing but comments.
 *
 * The rule always judges, and only its expectation moves: `except: after-closing-brace` reverses the option for a block holding no declaration, which such a block is, and otherwise `always-multi-line` wants the line in a multi-line block alone.
 * @param option - Its primary option.
 * @param secondary - Its secondary options.
 * @param isSingleLine - Whether the block is one line as the write leaves it.
 * @returns The accepted spellings.
 */
function acceptedByEmptyLine (option: string, secondary: Record<string, unknown>, isSingleLine: boolean): Run[] {
	let wantsTheLine = optionsMatches(secondary, `except`, `after-closing-brace`)
		? option === `never`
		: option === `always-multi-line` && !isSingleLine

	return wantsTheLine ? [`emptyLine`] : WITHOUT_AN_EMPTY_LINE
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
 * Run order is not asked: one rule asks and the three write whatever the configuration lists, so no order changes the answer. The copy of each of the three reading the root is asked.
 * @param node - A node of the root the rules read.
 * @param result - The Stylelint result, which holds the configuration.
 * @param primary - The asking rule's primary option.
 * @param isSingleLine - Whether the block is one line as the write leaves it.
 * @returns True where the asking rule writes the run.
 */
export function writesBlockAfter (node: Node, result: PostcssResult, primary: string, isSingleLine: boolean): boolean {
	let accepted = acceptedByWhitespace(primary, true)

	/**
	 * Asks whether a neighbor leaves the asking rule a spelling they both accept.
	 * @param neighborAccepts - The spellings the neighbor accepts.
	 * @returns True where the two sets meet.
	 */
	function agrees (neighborAccepts: Run[]): boolean {
		return neighborAccepts.some((run) => accepted.includes(run))
	}

	if (writingCopies(node, result, CLOSING_NEWLINE).some(({ option }) => speaksOf(option, () => isSingleLine) && !agrees(acceptedByWhitespace(option, true)))) return false

	if (writingCopies(node, result, CLOSING_SPACE).some(({ option }) => speaksOf(option, () => isSingleLine) && !agrees(acceptedByWhitespace(option, false)))) return false

	return writingCopies(node, result, CLOSING_EMPTY_LINE).every(({ option, secondary }) => agrees(acceptedByEmptyLine(option, secondary, isSingleLine)))
}
