import { EVERY_COMMENT_DELIMITER } from "../../regexps.js"
import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"

/** @typedef {import('../findInlineCommentSpans/index.js').InlineCommentSpan} InlineCommentSpan */

/**
 * Rewrites the inline comments of a value into block comments, as `postcss-scss` does when it fills the raw of that value: the two slashes opening a comment become the two characters opening a block comment, its line break becomes the two closing them, and a `*` followed by `/` in the text — or the other way round — is cut in two so that it closes nothing.
 * @param {string} spelled - The copy spelled as the file spells it.
 * @param {InlineCommentSpan[]} [spans] - The spans its inline comments occupy in it, where they are already known.
 * @returns {string} The value with each of those comments rewritten.
 */
export function rewriteInlineComments (spelled, spans = findInlineCommentSpans(spelled)) {
	let rewritten = ``
	let index = 0

	for (let { start, end } of spans) {
		let text = spelled.slice(start + 2, end).replaceAll(EVERY_COMMENT_DELIMITER, `*//*`)

		rewritten += `${spelled.slice(index, start)}/*${text}*/`
		index = end
	}

	return `${rewritten}${spelled.slice(index)}`
}
