import { type CommentSpan, findCommentSpans } from "../findCommentSpans/index.ts"
import type { InlineCommentSpan } from "../findInlineCommentSpans/index.ts"

/**
 * Blanks every comment of a text to spaces, delimiters and all, so a reader knowing less than {@link findCommentSpans} finds no comment to read for itself.
 *
 * `style-search` gets three things wrong: it ends an inline comment on a line feed alone, opens one on any double slash, `url(http://x/y.png)` included, and reads the end of one block comment and the start of the next as the `//` of a third. The copy is as long as the text, so every position stands where it did. The text is cut once and joined once, since a caller may hand over a whole file; a text with no span comes back as it is.
 * @param text - The value, selector or file to copy.
 * @param spans - The comment spans, where already known from either scan; only these are blanked.
 * @returns The text with every comment replaced by spaces.
 */
export function blankComments (text: string, spans: (CommentSpan | InlineCommentSpan)[] = findCommentSpans(text)): string {
	if (spans.length === 0) return text

	let pieces = []
	let index = 0

	for (let { start, end } of spans.toSorted((one, other) => one.start - other.start)) {
		if (end <= index) continue

		if (start > index) pieces.push(text.slice(index, start))

		pieces.push(` `.repeat(end - Math.max(start, index)))
		index = end
	}

	pieces.push(text.slice(index))

	return pieces.join(``)
}
