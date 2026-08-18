/**
 * Converts an index of the parsed selector into an index of the source the node is stringified from.
 * @param {number} index - The index in the parsed selector.
 * @param {import('../findSelectorInlineComments/index.js').InlineComment[]} inlineComments - The inline comments of the selector.
 * @returns {number} The index in the source.
 */
export function toSelectorSourceIndex (index, inlineComments) {
	let delta = 0

	for (let inlineComment of inlineComments) {
		if (inlineComment.endIndex > index) break

		delta = inlineComment.delta
	}

	return index - delta
}
