import { findCommentSpans } from "../findCommentSpans/index.js"

/** @typedef {import('../findCommentSpans/index.js').CommentSpan} CommentSpan */

/**
 * Blanks every comment of a text out of it, delimiters and all, so that a reader knowing less about the text than {@link findCommentSpans} does finds no comment there to read for itself.
 *
 * `style-search` reads the comments of a text by rules of its own, and gets three things wrong that the spans get right: it ends an inline comment on a line feed and on nothing else, it opens one on a double slash wherever it stands, the one in `url(http://x/y.png)` among them, and it reads the `*\/` closing one block comment and the `/*` opening the next as the two slashes of a third — `1px/*x*\//*y*\/,2px` holds no inline comment at all, and everything behind the pair was comment text to the search. Blanking answers all three at once: where a comment stood there are spaces, which no reader takes for anything.
 *
 * The spaces stand in for every character of the comment, its delimiters and the line breaks of its text among them, so the copy is as long as the text and spells it character for character everywhere else. Every position stands where it did, and the checks that follow are made against the text as it stands.
 * @param {string} text - The text to blank the comments of.
 * @param {CommentSpan[]} [spans] - The spans its comments occupy in it, where they are already known.
 * @returns {string} The text, with every comment replaced by spaces.
 */
export function blankComments (text, spans = findCommentSpans(text)) {
	let blanked = text

	for (let { start, end } of spans) blanked = blanked.slice(0, start) + ` `.repeat(end - start) + blanked.slice(end)

	return blanked
}
