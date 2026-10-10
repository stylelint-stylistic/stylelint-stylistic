import type { AtRule, Declaration, Rule } from "postcss"
import type { PostcssResult } from "stylelint"

import { LEADING_WHITESPACE_WITHOUT_BREAK, OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE } from "../../regexps.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { breakAtRereadsParentheses } from "../breakRereadsParentheses/index.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { type NeighborRule, neighborSettings, speaksOf } from "../neighborSettings/index.ts"
import { editsRereadAnAddress } from "../rereadsAnAddress/index.ts"
import { runBehind } from "../runBehind/index.ts"
import { runInFront } from "../runInFront/index.ts"
import { fixApplies } from "../writesKeepingAddresses/index.ts"

/** The four rules writing around the commas of one kind of list. */
type Twin = `newlineAfter` | `newlineBefore` | `spaceAfter` | `spaceBefore`

/** The lists whose commas four rules each write around. */
const FAMILIES = [`value-list`, `media-query-list`, `selector-list`] as const

/** The writes a `-list-comma-*-before` rule asks about at one comma: its own, and what the list's other comma rules running behind it write around the same comma, which the pass applies and the rule's own question is asked over rather than beside. */
export type AskedWrites = {

	/** The rule's own write, indexed in the text. */
	edits: Edit[],

	/** What the twins running behind the comma write there, indexed in the text, which the pass leaves standing before the rule's own write and the address question then reads. */
	assumed: Edit[],
}

/**
 * Names the four comma rules of a list's kind, by what each writes.
 * @param family - The kind of list.
 * @returns The rules.
 */
function twinsOf (family: typeof FAMILIES[number]): Record<Twin, NeighborRule> {
	return {
		spaceAfter: { name: `${family}-comma-space-after`, options: [`always`, `never`, `always-single-line`, `never-single-line`] },
		spaceBefore: { name: `${family}-comma-space-before`, options: [`always`, `never`, `always-single-line`, `never-single-line`] },
		newlineAfter: { name: `${family}-comma-newline-after`, options: [`always`, `always-multi-line`, `never-multi-line`] },
		newlineBefore: { name: `${family}-comma-newline-before`, options: [`always`, `always-multi-line`, `never-multi-line`] },
	}
}

/** The four comma rules of every kind of list, one table per kind, so that `neighborSettings` reads each table's names once. */
const TWINS = new Map(FAMILIES.map((family) => [family, twinsOf(family)]))

/**
 * Asks whether a twin writes a space rather than a break.
 * @param twin - The twin.
 * @returns True where it does.
 */
function writesSpace (twin: Twin): boolean {
	return twin === `spaceAfter` || twin === `spaceBefore`
}

/**
 * Spells a run around a comma as a twin's option leaves it: a space rule replaces it with one space or with nothing, `never-multi-line` takes it out, and `newline-after` under its `always` options adds a break in front of the run behind the comma where none stands, trimming the whitespace between the comma and a break already there, as the rule writes. A `newline-before` twin behind an asking rule carries `never-multi-line` alone: its `always` options are refused beside `space-before: always` and `never`, and run in front of a `-single-line` space rule, since an undeferred copy runs ahead of the deferred and among the deferred `linenessRank` puts a break rule first.
 * @param run - The run as it stands.
 * @param twin - Which rule writes it.
 * @param option - The option it is configured with.
 * @param lineBreak - The break the file uses.
 * @returns The run as the twin leaves it.
 */
function spelledBy (run: string, twin: Twin, option: string, lineBreak: string): string {
	if (writesSpace(twin)) return option.startsWith(`always`) ? ` ` : ``

	if (option === `never-multi-line`) return ``

	if (twin === `newlineAfter`) return OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(run) ? run.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``) : lineBreak + run

	return run
}

/**
 * Builds the writes a `-list-comma-*-before` rule asks about at one comma: its own, and what the list's other comma rules that run behind it in the pass write around the same comma, so that the question is asked of the text the pass leaves rather than of the one standing. A twin runs behind as `neighborSettings` orders the run: the configuration's order, the deferred copies behind every other in the plugin's order. One whose fix is off, or kept off the comma's line by a disable comment, writes nothing; one whose option turns on the list's lines is read against the list as the writes in front of it leave it; and one whose guards refuse its write over the text those leave, as they will be asked, writes nothing either. Of the twins' guards two are asked here, the address question and, for a break, the guard against a square bracket or a brace left open in parentheses the tokenizer holds as one token; the rest, which move a `-newline-after` check behind a block comment or refuse it in front of a `//` comment, are not, since with a solidus inside the parentheses the run behind the comma decides their reading under neither tier: an address's token takes them whole whatever they hold, and the other reading takes them as code on the solidus whether the break stays or goes.
 *
 * The run in front of the comma is spelled once for the rule and the twins writing it, and the run behind for the twins writing that; where the twins leave the run behind as it stands, no edit names it. The run in front is the rule's own write with the twins writing in front of it, asked as one; the run behind, written by a twin alone, is asked as the text the rule's own write leaves ({@link AskedWrites}).
 * @param text - The text the commas are found in.
 * @param runString - The copy of it the runs are read over, with the escapes masked.
 * @param index - The comma.
 * @param problemIndex - Where the comma stands in the node's string, where the twins report and Stylelint reads the line a disable comment covers.
 * @param own - The rule's own write, inside the run in front of the comma.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param node - The node the text is read from.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - The asking rule's registered name.
 * @returns The rule's own write and the twins' writes behind the comma, both indexed in the text.
 */
export function editsAskedWithTheTwins (text: string, runString: string, index: number, problemIndex: number, own: Edit, reading: Pick<CommentReading, `tokenizes`>, node: AtRule | Declaration | Rule, result: PostcssResult, ruleName: string): AskedWrites {
	let family = FAMILIES.find((name) => ruleName.includes(`${name}-comma-`))
	let twins = family && TWINS.get(family)

	if (!twins) return { edits: [own], assumed: [] }

	let settings = neighborSettings(node, result, twins)
	let position = settings.findIndex(([, , , name]) => name === ruleName)
	let behindUs = position === -1 ? [] : settings.slice(position + 1).filter(([, , fixOff, name]) => !fixOff && fixApplies(node, problemIndex, result, name))
	let lineBreak = getLineBreak(node, result)
	let runFront = runInFront(runString, index)
	let frontStart = index - runFront.length
	let front = runFront.slice(0, own.start - frontStart) + own.text + runFront.slice(own.end - frontStart)
	let runBack = runBehind(runString, index)
	let back = runBack
	// The text as the writes assumed so far leave it, where the comma then stands
	let current = text.slice(0, frontStart) + front + text.slice(index)
	let comma = frontStart + front.length

	/**
	 * Asks whether the list is one line as the writes assumed so far leave it.
	 * @returns True where it is.
	 */
	function isSingleLine (): boolean {
		return isSingleLineString(current)
	}

	for (let [twin, option] of behindUs) {
		if (!speaksOf(option, isSingleLine)) continue

		let writesFront = twin === `spaceBefore` || twin === `newlineBefore`
		let spelled = spelledBy(writesFront ? front : back, twin, option, lineBreak)
		let edit: Edit = writesFront ? { start: comma - front.length, end: comma, text: spelled } : { start: comma + 1, end: comma + 1 + back.length, text: spelled }

		if (edit.text === (writesFront ? front : back) || editsRereadAnAddress(current, [edit], reading, node)) continue

		// A newline twin refuses its break into parentheses the tokenizer holds as one token where a `[`, or a `{` in a custom property's value or an at-rule's params, is left open once the break makes them code
		if (!writesSpace(twin) && option.startsWith(`always`) && breakAtRereadsParentheses(current, comma, node.type === `atrule` || (node.type === `decl` && isCustomProperty(node.prop)), reading)) continue

		current = applyEditsFromEnd(current, [edit])

		if (writesFront) {
			comma += spelled.length - front.length
			front = spelled
		}
		else back = spelled
	}

	let edits: Edit[] = [{ start: frontStart, end: index, text: front }]
	let assumed: Edit[] = []

	if (back !== runBack) assumed.push({ start: index + 1, end: index + 1 + runBack.length, text: back })

	return { edits, assumed }
}
