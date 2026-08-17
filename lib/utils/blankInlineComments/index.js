import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"

/** @typedef {import('../findInlineCommentSpans/index.js').InlineCommentSpan} InlineCommentSpan */

/**
 * Blanks the text of the inline comments a value carries out of it, so that a parser reading that value finds no code in them. A quotation mark inside a comment would open a string for it otherwise, and every string on the far side of the comment would be read one quotation mark out of step, the fix then taking those readings for the code and pulling the value apart. The spaces standing in leave every position of the value where it was, and no comment holds a line break for them to swallow.
 * @param {string} value - The value to blank the comments of.
 * @param {InlineCommentSpan[]} [spans] - The spans its inline comments occupy in it, where they are already known.
 * @returns {string} The value, with the text of each of its inline comments replaced by spaces.
 */
export function blankInlineComments (value, spans = findInlineCommentSpans(value)) {
	let blanked = value

	for (let { start, end } of spans) blanked = blanked.slice(0, start) + ` `.repeat(end - start) + blanked.slice(end)

	return blanked
}
