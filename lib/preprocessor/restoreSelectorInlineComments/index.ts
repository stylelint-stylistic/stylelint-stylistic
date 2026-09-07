import { findSelectorBlockComments } from "../../utils/findSelectorBlockComments/index.ts"
import type { InlineComment } from "../findSelectorInlineComments/index.ts"

/**
 * Gives a selector's inline comments their source spelling back, so a fix written to the raw suits the copy `postcss-scss` prints. A comment is found by its place among the block comments, not by its text, which may recur elsewhere.
 * @param rawSelector - The selector as a fix left it, every comment a block one.
 * @param inlineComments - The `//` comments of the source, each placed by its ordinals.
 * @returns The selector as the source spells it.
 */
export function restoreSelectorInlineComments (rawSelector: string, inlineComments: InlineComment[]): string {
	if (inlineComments.length === 0) return rawSelector

	let comments = findSelectorBlockComments(rawSelector)
	let spelled = ``
	let readUpTo = 0

	for (let inlineComment of inlineComments) {
		let first = comments[inlineComment.firstOrdinal]
		let last = comments[inlineComment.lastOrdinal]

		// The fix left fewer comments; the rest goes back as it stands
		if (!first || !last) break

		spelled += rawSelector.slice(readUpTo, first.start) + inlineComment.value
		readUpTo = last.end + inlineComment.tailLength
	}

	return spelled + rawSelector.slice(readUpTo)
}
