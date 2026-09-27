import type { AtRule, Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { addEdit, type Edit } from "../applyEditsFromEnd/index.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { placedNode } from "../report/index.ts"
import { editsRereadAnAddress } from "../rereadsAnAddress/index.ts"

/** A fix a rule would give a problem, before the address question is asked. */
export type WriteCandidate = {

	/** The spans the fix writes, indexed in the text, or nothing where another guard refuses it. */
	edits: Edit[] | undefined,

	/** Where the problem stands in the node's string, whose start line Stylelint compares with the disable ranges. */
	index: number,
}

/**
 * Asks whether a problem's fix is applied: Stylelint drops it on a line a disable comment covers for the rule, and the plugin's `report` drops a problem no node holds a place for.
 * @param node - The node the problem is reported on.
 * @param index - Where the problem stands in the node's string.
 * @param result - The Stylelint result.
 * @param ruleName - The registered name.
 * @returns True where the fix is applied once given.
 */
function fixApplies (node: AtRule | Declaration, index: number, result: PostcssResult, ruleName: string): boolean {
	let placed = placedNode(node)
	let line = placed === node ? node.rangeBy({ index, endIndex: index }).start.line : placed?.source?.start?.line

	return line !== undefined && !fixDisabledOnLine(result, ruleName, line)
}

/**
 * Says which of the fixes a rule would give over one text may be given, so that no address's parentheses are read another way ({@link editsRereadAnAddress}).
 *
 * A write into a call's parentheses can switch which word a later `(` pops, and so whether it opens an address's token, and two writes can do together what neither does alone, so each is asked along with the writes given already. A write refused against those may be safe once a later one is given, since that one can put the word back, so the fixes are asked again until none more is given: whatever is refused is then refused against the very writes the run applies, and a second `--fix` finds nothing more to give. A fix Stylelint drops is never counted among them.
 * @param text - The text the edits index in.
 * @param candidates - The fixes, in the order the rule reports them; where two writes conflict, the one reported first is given.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param node - The node the text is read from and the problems are reported on.
 * @param result - The Stylelint result.
 * @param ruleName - The registered name.
 * @returns For each fix, whether it may be given.
 */
export function writesKeepingAddresses (text: string, candidates: WriteCandidate[], reading: Pick<CommentReading, `tokenizes`>, node: AtRule | Declaration, result: PostcssResult, ruleName: string): boolean[] {
	let applied = candidates.map(({ edits, index }) => edits !== undefined && fixApplies(node, index, result, ruleName))
	let given = candidates.map(() => false)
	let written: Edit[] = []
	let isGrowing = true

	while (isGrowing) {
		isGrowing = false

		for (let [candidateIndex, { edits }] of candidates.entries()) {
			if (!edits || !applied[candidateIndex] || given[candidateIndex]) continue

			let asked = structuredClone(written)

			for (let edit of edits) addEdit(asked, edit)

			if (editsRereadAnAddress(text, asked, reading, node)) continue

			written = asked
			given[candidateIndex] = true
			isGrowing = true
		}
	}

	return given
}
