import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { type NeighbourRuleSetting, neighbourSetting, speaksOf } from "../neighbourSettings/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"

/** A spelling of the whitespace run in front of a closing brace. */
type Run = `newline` | `emptyLine` | `space` | `none` | `other`

/** What a break rule's `always` accepts. */
const OPENS_WITH_A_BREAK: Run[] = [`newline`, `emptyLine`]

/** What `block-closing-brace-empty-line-before` accepts where it wants no empty line. */
const WITHOUT_AN_EMPTY_LINE: Run[] = [`newline`, `space`, `none`, `other`]

/** The rule about a break in front of the closing brace. */
const CLOSING_NEWLINE: NeighbourRuleSetting = {
	name: `block-closing-brace-newline-before`,
	options: [`always`, `always-multi-line`, `never-multi-line`],
}

/** The rule about a space in front of the closing brace. */
const CLOSING_SPACE: NeighbourRuleSetting = {
	name: `block-closing-brace-space-before`,
	options: [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
}

/** The rule about an empty line in front of the closing brace. */
const CLOSING_EMPTY_LINE: NeighbourRuleSetting = {
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
 * Reads a neighbour's setting, where it is listed with an option it accepts and a fix that would rewrite the run.
 * @param syntax - The asking rule's syntax, whose namespace names the neighbour.
 * @param result - The Stylelint result, which holds the configuration.
 * @param rule - The neighbour and the primaries it accepts.
 * @returns The primary and the secondaries, or nothing where the neighbour gates nothing.
 */
function writingNeighbour (syntax: Syntax, result: PostcssResult, rule: NeighbourRuleSetting): { option: string, secondary: Record<string, unknown> } | undefined {
	let setting = neighbourSetting(syntax, result, rule)

	// A turned-off fix rewrites nothing, so it gates nothing (#485)
	if (!setting || setting.fixDisabled || typeof setting.option !== `string`) return

	return { option: setting.option, secondary: setting.secondary }
}

/**
 * Asks whether `block-opening-brace-newline-after` is the one to write the run in front of the closing brace of a block holding nothing but comments, the run the three `block-closing-brace-*-before` rules write ([#676](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/676)).
 *
 * It writes only where every one of the three that speaks of the block as the write leaves it accepts a spelling it accepts too; otherwise the run would be taken straight back out, and the two rules would take it in turns for as long as `--fix` ran. Sharing a spelling rather than accepting the written one is what lets `block-closing-brace-empty-line-before` double the break this rule writes ([#416](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416)).
 *
 * Run order is not asked: one rule asks and the three write whatever the configuration lists, so no order changes the answer.
 * @param syntax - The asking rule's syntax, whose namespace names the neighbours.
 * @param result - The Stylelint result, which holds the configuration.
 * @param primary - The asking rule's primary option.
 * @param isSingleLine - Whether the block is one line as the write leaves it.
 * @returns True where the asking rule writes the run.
 */
export function writesBlockAfter (syntax: Syntax, result: PostcssResult, primary: string, isSingleLine: boolean): boolean {
	let accepted = acceptedByWhitespace(primary, true)
	let newline = writingNeighbour(syntax, result, CLOSING_NEWLINE)
	let space = writingNeighbour(syntax, result, CLOSING_SPACE)
	let emptyLine = writingNeighbour(syntax, result, CLOSING_EMPTY_LINE)

	/**
	 * Asks whether a neighbour leaves the asking rule a spelling they both accept.
	 * @param neighbourAccepts - The spellings the neighbour accepts.
	 * @returns True where the two sets meet.
	 */
	function agrees (neighbourAccepts: Run[]): boolean {
		return neighbourAccepts.some((run) => accepted.includes(run))
	}

	if (newline && speaksOf(newline.option, () => isSingleLine) && !agrees(acceptedByWhitespace(newline.option, true))) return false

	if (space && speaksOf(space.option, () => isSingleLine) && !agrees(acceptedByWhitespace(space.option, false))) return false

	return !emptyLine || agrees(acceptedByEmptyLine(emptyLine.option, emptyLine.secondary, isSingleLine))
}
