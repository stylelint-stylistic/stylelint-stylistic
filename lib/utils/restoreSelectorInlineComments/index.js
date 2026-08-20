import { findSelectorBlockComments } from "../findSelectorBlockComments/index.js"

/**
 * Gives a selector's inline comments their source spelling back, so that a fix written to the raw suits the copy `postcss-scss` prints.
 *
 * A comment is found by the place it stands in among the block comments of the selector, rather than by its text: the same text may stand in a comment of the other kind, or in a quoted attribute value, and rewriting one of those would write code away.
 * @param {string} rawSelector - The selector as the rules write it, block comments and all.
 * @param {import('../findSelectorInlineComments/index.js').InlineComment[]} inlineComments - The inline comments of the selector.
 * @returns {string} The selector spelled the way the source spells it.
 */
export function restoreSelectorInlineComments (rawSelector, inlineComments) {
	if (inlineComments.length === 0) return rawSelector

	let comments = findSelectorBlockComments(rawSelector)
	let spelled = ``
	let readUpTo = 0

	for (let inlineComment of inlineComments) {
		let first = comments[inlineComment.firstOrdinal]
		let last = comments[inlineComment.lastOrdinal]

		// A selector the fix has left fewer comments in is one this cannot answer for, and the rest of it goes back as it stands.
		if (!first || !last) break

		spelled += rawSelector.slice(readUpTo, first.start) + inlineComment.value
		readUpTo = last.end + inlineComment.tailLength
	}

	return spelled + rawSelector.slice(readUpTo)
}
