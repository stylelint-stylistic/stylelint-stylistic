import { LINE_BREAK } from "../../regexps.ts"
import { findSelectorBlockComments } from "../../utils/findSelectorBlockComments/index.ts"

/**
 * Gets the end of the line holding `index`, or of the text.
 * @param text - The selector's source.
 * @param index - An offset on the line asked about.
 * @returns The end of the line.
 */
function endOfLine (text: string, index: number): number {
	let match = LINE_BREAK.exec(text.slice(index))

	return match ? index + match.index : text.length
}

/** An inline comment of a selector in both spellings. */
export type InlineComment = {
	value: string,
	firstOrdinal: number,
	lastOrdinal: number,
	tailLength: number,
	startIndex: number,
	endIndex: number,
	delta: number,
}

/**
 * Collects a selector's `//` comments, pairing raw text with source text.
 *
 * `postcss-scss` rewrites every `//` comment of a selector into block comments in `raws.selector.raw` and prints the source kept in `raws.selector.scss`. The two are read side by side, not counted, since `// a *\/ b` becomes two block comments, and followed to the end of the line where they part. A comment is recorded by the place of its block comments among the selector's, which a fixed selector is read back through.
 * @param rawSelector - The raw the rules read.
 * @param scssSelector - The source, if it differs.
 * @returns The comments in source order.
 */
export function findSelectorInlineComments (rawSelector: string, scssSelector?: string): InlineComment[] {
	let inlineComments: InlineComment[] = []

	if (!scssSelector || scssSelector === rawSelector) return inlineComments

	let comments = findSelectorBlockComments(rawSelector)
	let rawIndex = 0
	let sourceIndex = 0
	let delta = 0

	while (rawIndex < rawSelector.length && sourceIndex < scssSelector.length) {
		if (rawSelector[rawIndex] === scssSelector[sourceIndex]) {
			rawIndex += 1
			sourceIndex += 1

			continue
		}

		// Both spellings share the opening slash; the divergence is one character in.
		let startIndex = rawSelector.lastIndexOf(`/*`, rawIndex)
		let endIndex = endOfLine(rawSelector, rawIndex)
		let sourceStartIndex = sourceIndex - (rawIndex - startIndex)
		let sourceEndIndex = endOfLine(scssSelector, sourceIndex)
		let value = scssSelector.slice(sourceStartIndex, sourceEndIndex)
		let firstOrdinal = comments.findIndex((comment) => startIndex <= comment.start && comment.end <= endIndex)
		let lastOrdinal = comments.findLastIndex((comment) => startIndex <= comment.start && comment.end <= endIndex)

		delta += (endIndex - startIndex) - value.length

		let lastComment = comments[lastOrdinal]

		if (firstOrdinal !== -1 && lastComment) {
			inlineComments.push({ value, firstOrdinal, lastOrdinal, tailLength: endIndex - lastComment.end, startIndex, endIndex, delta })
		}

		rawIndex = endIndex
		sourceIndex = sourceEndIndex
	}

	return inlineComments
}
