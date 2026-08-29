import { LINE_BREAK } from "../../regexps.ts"
import { findSelectorBlockComments } from "../findSelectorBlockComments/index.ts"

/**
 * Gets the index the line an index stands on ends at, which is the end of the text where the line is the last one.
 * @param text - The text to read.
 * @param index - The index to read from.
 * @returns The index the line ends at.
 */
function endOfLine (text: string, index: number): number {
	let match = LINE_BREAK.exec(text.slice(index))

	return match ? index + match.index : text.length
}

/** An inline comment of a selector, as both spellings have it. */
type InlineComment = {
	value: string,
	firstOrdinal: number,
	lastOrdinal: number,
	tailLength: number,
	startIndex: number,
	endIndex: number,
	delta: number,
}

/**
 * Collects the inline comments of a selector, pairing the text of each one in the raw the rules read with the text the source gives it.
 *
 * `postcss-scss` rewrites every inline comment of a selector into block comments inside `raws.selector.raw`, keeps the source spelling in `raws.selector.scss` and prints that one, so the two strings drift apart wherever a comment stands.
 *
 * The two spellings are read side by side rather than counted, since one comment does not always answer to one: a `*\/` in the text of an inline comment closes a block comment, so `// a *\/ b` is written with two. Where the strings part they are followed to the end of the line, which is where the comment ends and the two meet again — the syntax ends one on a carriage return and on a form feed as readily as on a line feed.
 *
 * Each comment is recorded by the place its block comments stand in among the block comments of the selector, which is what a fixed selector can be read back through: a fix moves whitespace and leaves every comment where it was, so the count and the order hold.
 * @param rawSelector - The selector as the rules read it.
 * @param scssSelector - The source spelling of the selector, if the two differ.
 * @returns The inline comments, in source order.
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

		// The two spellings share the slash the comment opens with, so the divergence stands a character inside it; the comment begins where its first block comment does.
		let startIndex = rawSelector.lastIndexOf(`/*`, rawIndex)
		let endIndex = endOfLine(rawSelector, rawIndex)
		let sourceStartIndex = sourceIndex - (rawIndex - startIndex)
		let sourceEndIndex = endOfLine(scssSelector, sourceIndex)
		let value = scssSelector.slice(sourceStartIndex, sourceEndIndex)
		let firstOrdinal = comments.findIndex((comment) => startIndex <= comment.start && comment.end <= endIndex)
		let lastOrdinal = comments.findLastIndex((comment) => startIndex <= comment.start && comment.end <= endIndex)

		delta += (endIndex - startIndex) - value.length

		if (firstOrdinal !== -1) {
			inlineComments.push({ value, firstOrdinal, lastOrdinal, tailLength: endIndex - comments[lastOrdinal].end, startIndex, endIndex, delta })
		}

		rawIndex = endIndex
		sourceIndex = sourceEndIndex
	}

	return inlineComments
}

export type { InlineComment }
