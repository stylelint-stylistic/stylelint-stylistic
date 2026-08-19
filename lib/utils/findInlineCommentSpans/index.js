import { findCommentSpans } from "../findCommentSpans/index.js"

/**
 * The span an inline comment occupies in a value, in the coordinates of the file, and how far the copy a syntax rewrote its comments in has run away from that value by the end of the comment.
 * @typedef {{ start: number, end: number, delta?: number }} InlineCommentSpan
 */

/**
 * Finds the spans the inline comments of a string occupy in it. A double slash belonging to an address opens no comment, whether the address is quoted or bare inside `url()`, and neither does one inside a block comment; a comment ends with its line rather than with the string.
 * @param {string} text - The string to scan.
 * @param {boolean} [endsOnFormFeed] - True where the syntax that spelled the string reads a line in a form feed, which {@link endsInlineCommentOnFormFeed} answers for a node.
 * @param {boolean} [spellsInlineComments] - False where the syntax that spelled the string writes no comment with a double slash, which {@link readsInlineComments} answers for a node.
 * @returns {InlineCommentSpan[]} The spans, in the coordinates of the scanned string.
 */
export function findInlineCommentSpans (text, endsOnFormFeed = false, spellsInlineComments = true) {
	return findCommentSpans(text, endsOnFormFeed, spellsInlineComments)
		.filter(({ isInline }) => isInline)
		.map(({ start, end }) => ({ start, end }))
}
