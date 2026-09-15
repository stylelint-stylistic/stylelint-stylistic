import { EVERY_QUOTATION_MARK } from "../../regexps.ts"
import { blankComments } from "../blankComments/index.ts"
import { type CommentSpan, findAddressSpans, findStringSpans } from "../findCommentSpans/index.ts"
import type { InlineCommentSpan } from "../findInlineCommentSpans/index.ts"

/** The comments are blanked before the walk, so a `//` left in the text is code and opens nothing. */
const CODE_READING = { spells: false, tokenizes: false, endsOnFormFeed: false }

/**
 * Writes every character of the spans as `?`.
 * @param text - The text.
 * @param spans - The spans, in source order; a quoted address's marks lie inside its string.
 * @returns The text with the spans masked.
 */
function mask (text: string, spans: InlineCommentSpan[]): string {
	let pieces = []
	let index = 0

	for (let { start, end } of spans) {
		if (end <= index) continue

		pieces.push(text.slice(index, Math.max(start, index)), `?`.repeat(end - Math.max(start, index)))
		index = end
	}

	pieces.push(text.slice(index))

	return pieces.join(``)
}

/**
 * Masks every string of a text, quotation marks and all, and every quotation mark inside an address, so `style-search` opens no string by its own reading: it opens one at a mark inside a bare address, where the tokenizer reads a character of the address, and closes none at a mark with a backslash in front, escaped or not (#739).
 *
 * A `?` stands in, not a space, since callers match patterns against the copy, and whitespace there reads as a run in front of an operator or behind a `(` ending its line. The strings and addresses are found over the text with its comments blanked, so a mark inside a comment opens nothing; the comments stay in the copy, which is as long as the text.
 * @param text - The text the search runs over.
 * @param comments - The comment spans the syntax finds in it.
 * @returns The copy.
 */
export function maskStrings (text: string, comments: CommentSpan[]): string {
	if (!text.includes(`"`) && !text.includes(`'`)) return text

	let code = blankComments(text, comments)
	let marks = findAddressSpans(code, CODE_READING).flatMap(({ start, end }) => [...code.slice(start, end).matchAll(EVERY_QUOTATION_MARK)].map(({ index }) => ({ start: start + index, end: start + index + 1 })))

	return mask(text, [...findStringSpans(code, CODE_READING), ...marks].toSorted((one, other) => one.start - other.start))
}
