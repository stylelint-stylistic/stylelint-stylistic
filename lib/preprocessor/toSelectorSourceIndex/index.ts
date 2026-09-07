import type { InlineComment } from "../findSelectorInlineComments/index.ts"

/**
 * Converts an index of the parsed selector into an index of the source.
 * @param index - The index in the parsed selector.
 * @param inlineComments - The selector's inline comments.
 * @returns The index in the source.
 */
export function toSelectorSourceIndex (index: number, inlineComments: InlineComment[]): number {
	let delta = 0

	for (let inlineComment of inlineComments) {
		if (inlineComment.endIndex > index) break

		delta = inlineComment.delta
	}

	return index - delta
}
