import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"

/** @typedef {import('../findInlineCommentSpans/index.js').InlineCommentSpan} InlineCommentSpan */

/**
 * Closes every inline comment of a text with a line feed, leaving the text otherwise as it stands.
 *
 * `style-search` skips the text of an inline comment, so that no code is read out of one, but it ends
 * such a comment with a line feed and with nothing else. A comment closed by a carriage return, or by
 * a form feed where the syntax reads a line in one, would hide the rest of the text from it — the
 * code behind the comment as well as its own. Writing that break as a line feed puts the end of the
 * comment where the syntax puts it, and takes nothing else away: the copy is as long as the text and
 * spells it character for character everywhere else, so every position stands where it did.
 * @param {string} text - The text to close the comments of.
 * @param {InlineCommentSpan[]} [spans] - The spans its inline comments occupy in it, where they are already known.
 * @returns {string} The text, with the break closing each of its inline comments written as a line feed.
 */
export function closeInlineComments (text, spans = findInlineCommentSpans(text)) {
	let closed = text

	for (let { end } of spans) {
		if (end < closed.length && closed[end] !== `\n`) closed = `${closed.slice(0, end)}\n${closed.slice(end + 1)}`
	}

	return closed
}
