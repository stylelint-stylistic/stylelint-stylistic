import type { AtRule, Declaration, Rule } from "postcss"
import type { PostcssResult } from "stylelint"

import { addEdit, applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { placedNode } from "../report/index.ts"
import { editsRereadAnAddress } from "../rereadsAnAddress/index.ts"

/** A fix a rule would give a problem, before the address question is asked. */
export type WriteCandidate = {

	/** The spans the fix writes, indexed in the text, or nothing where another guard refuses it. */
	edits: Edit[] | undefined,

	/** Whether the fix may be given over the text the writes given so far leave, its indices moved into that text: a guard reading the text around the write, which the other writes of the run can change. */
	holds?: ((edited: string, move: (index: number) => number) => boolean) | undefined,

	/** Where the problem stands in the node's string, whose start line Stylelint compares with the disable ranges. */
	index: number,
}

/**
 * Moves an index of the text edits apply to into the text they leave: past what the edits in front of it write, an insertion at the index itself among them; an index inside a span an edit replaces stays where it was.
 * @param edits - The edits, indexed in the text they apply to.
 * @returns The mover.
 */
function moverOver (edits: Edit[]): (index: number) => number {
	return (index) => index + edits.filter(({ end }) => end <= index).reduce((shift, { start, end, text }) => shift + text.length - (end - start), 0)
}

/**
 * Asks whether a problem's fix is applied: Stylelint drops it on a line a disable comment covers for the rule, and the plugin's `report` drops a problem no node holds a place for.
 * @param node - The node the problem is reported on.
 * @param index - Where the problem stands in the node's string.
 * @param result - The Stylelint result.
 * @param ruleName - The registered name.
 * @returns True where the fix is applied once given.
 */
function fixApplies (node: AtRule | Declaration | Rule, index: number, result: PostcssResult, ruleName: string): boolean {
	let placed = placedNode(node)
	let line = placed === node ? node.rangeBy({ index, endIndex: index }).start.line : placed?.source?.start?.line

	return line !== undefined && !fixDisabledOnLine(result, ruleName, line)
}

/**
 * Says which of the fixes a rule would give over one text may be given, so that no address's parentheses are read another way ({@link editsRereadAnAddress}).
 *
 * A write into a call's parentheses, or into parentheses the tokenizer takes as one plain token, can switch which word a later `(` pops, and so whether it opens an address's token, and a run written or taken out right in front of `url(` or right behind its `(` switches the reading of those parentheses themselves; two writes can do together what neither does alone, so each is asked along with the writes given already. A write refused against those may be safe once a later one is given, since that one can put the word back, so the fixes are asked again until none more is given: whatever is refused is then refused against the very writes the run applies, and a second `--fix` finds nothing more to give. A guard of the fix's own is asked the same way, over the text the writes given leave rather than the one standing: a break refused into parentheses the tokenizer holds as one plain token is given once another write of the run makes them an address's token, which the parser reads nothing of. The guard is asked against the writes given before it and not again against those given after: the writes the rules hand in are breaks, and a break written later in the text changes no word an earlier `(` pops, so no later write takes an address's token the guard passed back; the other way round, a write that switches a reading, is what the address question asks with every write. A fix Stylelint drops is never counted among them.
 * @param text - The text the edits index in.
 * @param candidates - The fixes, in the order the rule reports them; where two writes conflict, the one reported first is given.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param node - The node the text is read from and the problems are reported on.
 * @param result - The Stylelint result.
 * @param ruleName - The registered name.
 * @returns For each fix, whether it may be given.
 */
export function writesKeepingAddresses (text: string, candidates: WriteCandidate[], reading: Pick<CommentReading, `tokenizes`>, node: AtRule | Declaration | Rule, result: PostcssResult, ruleName: string): boolean[] {
	let applied = candidates.map(({ edits, index }) => edits !== undefined && fixApplies(node, index, result, ruleName))
	let given = candidates.map(() => false)
	let written: Edit[] = []
	let isGrowing = true

	while (isGrowing) {
		isGrowing = false

		for (let [candidateIndex, { edits, holds }] of candidates.entries()) {
			if (!edits || !applied[candidateIndex] || given[candidateIndex]) continue

			let asked = structuredClone(written)

			for (let edit of edits) addEdit(asked, edit)

			if (editsRereadAnAddress(text, asked, reading, node)) continue

			if (holds && !holds(applyEditsFromEnd(text, written), moverOver(written))) continue

			written = asked
			given[candidateIndex] = true
			isGrowing = true
		}
	}

	return given
}
