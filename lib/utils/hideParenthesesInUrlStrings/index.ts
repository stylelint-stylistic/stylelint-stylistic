import valueParser from "postcss-value-parser"

import { type CommentSpan, findCommentSpanAt, findCommentSpans } from "../findCommentSpans/index.ts"
import type { InlineCommentSpan } from "../findInlineCommentSpans/index.ts"
import { isWhitespace } from "../isWhitespace/index.ts"

/** The mask, as {@link hideQuotesInComments} writes it: `?` opens and closes nothing. */
const MASK = `?`

/**
 * Skips a string as PostCSS's tokenizer reads one: to the next mark of its kind no escape holds, or to the end of the text.
 * @param text - The text holding the string.
 * @param openIndex - The opening mark.
 * @returns Behind the closing mark, or the text's length.
 */
function skipString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return Math.min(index + 1, text.length)
}

/**
 * Skips a block comment: to behind its closing delimiter, or to the end of the text.
 * @param text - The text holding the comment.
 * @param openIndex - The solidus opening it.
 * @returns Behind the comment.
 */
function skipBlockComment (text: string, openIndex: number): number {
	let closeIndex = text.indexOf(`*/`, openIndex + 2)

	return closeIndex === -1 ? text.length : closeIndex + 2
}

/**
 * Finds every `)` inside a string or a comment that holds the `)` the parser closes the parentheses of a `url( ` on, in walk order.
 * @param text - The value parsed.
 * @param spans - The comment spans found in the value, both kinds.
 * @returns The indices.
 */
function findHeldParentheses (text: string, spans: (CommentSpan | InlineCommentSpan)[]): number[] {
	let held: number[] = []

	valueParser(text).walk((node) => {
		if (node.type !== `function` || node.value !== `url` || node.unclosed) return

		let openIndex = node.sourceIndex + node.value.length + 1
		let closeIndex = node.sourceEndIndex - 1

		// A comment behind the `(` may stand blanked to spaces, and the tokenizer reads a bare address there
		if (!isWhitespace(text.charAt(openIndex)) || findCommentSpanAt(openIndex, spans)) return

		let index = openIndex

		while (index < closeIndex) {
			let comment = findCommentSpanAt(index, spans)

			// A `)` inside a comment the caller knows is its guards' to answer for
			if (comment) {
				index = comment.end
				continue
			}

			let end = index + 1

			if (text[index] === `\\`) end = index + 2
			else if (text[index] === `"` || text[index] === `'`) end = skipString(text, index)
			// The walk for comments stops at a string's `)` and finds none behind it
			else if (text[index] === `/` && text[index + 1] === `*`) end = skipBlockComment(text, index)

			if (end > closeIndex) {
				for (let at = index; at < end; at += 1) {
					if (text[at] === `)`) held.push(at)
				}
			}

			index = end
		}
	})

	return held
}

/**
 * Masks the `)` inside a string that the parentheses of a `url( ` hold, so that `postcss-value-parser` closes them where PostCSS does.
 *
 * The parser reads everything behind `url(` to the first `)` as one word wherever no quotation mark opens the parentheses; behind the tokenizer's whitespace PostCSS reads them as code, where a string holds its `)`. Only that trigger is read: a name glued to a sign in front, `,url(`, is code to the tokenizer too. The rules skipping the address read the string's tail as code of the value and wrote into it. A block comment behind such a string is read here as well, since the comment walk stops at the string's `)`; a comment the spans hold is left to the caller's guards.
 *
 * The parse is remade after each pass, since the parser reads on to the next `)`, which another string may hold. The mask keeps the width, so parse indexes count in the file's text.
 * @param text - The value or params to mask.
 * @param spans - Its comment spans, from either scan.
 * @returns The masked text.
 */
export function hideParenthesesInUrlStrings (text: string, spans: (CommentSpan | InlineCommentSpan)[] = findCommentSpans(text)): string {
	let masked = text

	for (let held = findHeldParentheses(masked, spans); held.length > 0; held = findHeldParentheses(masked, spans)) {
		// Code units, as the parse counts
		let characters = masked.split(``)

		for (let index of held) characters[index] = MASK

		masked = characters.join(``)
	}

	return masked
}
