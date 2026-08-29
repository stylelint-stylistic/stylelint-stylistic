/**
 * Converts an index of the parsed selector into an index of the source the node is stringified from.
 * @param index - The index in the parsed selector.
 * @param inlineComments - The inline comments of the selector.
 * @returns The index in the source.
 */
export function toSelectorSourceIndex (index: number, inlineComments: import("../findSelectorInlineComments/index.ts").InlineComment[]): number {
	let delta = 0

	for (let inlineComment of inlineComments) {
		if (inlineComment.endIndex > index) break

		delta = inlineComment.delta
	}

	return index - delta
}
