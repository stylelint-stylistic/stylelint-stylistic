import valueParser from "postcss-value-parser"

import { TOKENIZER_WORD_END } from "../../regexps.ts"
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
 * Tells whether PostCSS's tokenizer takes the name of a call as a word of its own, which is where it reads the parentheses of a `url(` as a bare address.
 * @param text - The value parsed.
 * @param nameIndex - Where the name begins.
 * @param spans - The comment spans found in the value, both kinds.
 * @returns True where nothing glues to the name's front.
 */
function standsAloneAsWord (text: string, nameIndex: number, spans: (CommentSpan | InlineCommentSpan)[]): boolean {
	if (nameIndex === 0) return true

	let before = nameIndex - 1

	return Boolean(findCommentSpanAt(before, spans)) || TOKENIZER_WORD_END.test(text.charAt(before))
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

		// A comment behind the `(` may stand blanked to spaces, and the tokenizer reads none of it as whitespace
		let spaceBehindParenthesis = isWhitespace(text.charAt(openIndex)) && !findCommentSpanAt(openIndex, spans)

		// The tokenizer reads a bare address behind a `url` of its own word, where no whitespace of its follows the `(`
		if (!spaceBehindParenthesis && standsAloneAsWord(text, node.sourceIndex, spans)) return

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
			// A comment the spans handed in do not hold
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
 * The parser reads everything behind `url(` to the first `)` as one word wherever no quotation mark opens the parentheses. PostCSS reads the parentheses as code, where a string holds its `)`, on two triggers this asks about: whitespace of its own behind the `(`, and a name its tokenizer does not take as a word of its own, which is every boundary of the parser's the tokenizer does not share — a comma, a solidus, a star inside `calc()` and every code point of 32 and under outside its five whitespaces. A quotation mark behind the `(` is a third trigger of the tokenizer's and is not asked about: the parser reads no address there either. The rules skipping the address read the string's tail as code of the value and wrote into it. A block comment the spans handed in do not hold is read here as well; a comment they hold is left to the caller's guards.
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
