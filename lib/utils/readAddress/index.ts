import { OPENS_WITH_QUOTE } from "../../regexps.ts"
import type { CommentSpan } from "../findCommentSpans/index.ts"
import { isWhitespace } from "../isWhitespace/index.ts"

/** The address a `url()`'s parentheses hold. */
export type Address = {

	/** True where a quotation mark opens it, whitespace aside: the marks are its own, and what stands behind it inside the parentheses is code. */
	isQuoted: boolean,

	/** The opening quotation mark, or the `)` closing a bare address — the text's length where no `)` stands. */
	index: number,

	/** The block comments standing inside the parentheses, which only a bare address behind whitespace holds. */
	comments: CommentSpan[],
}

/**
 * Reads the address a `url()`'s parentheses hold, the one reading the comment walk and the `//`-comment guard both ask ([#557](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/557)).
 *
 * A quotation mark behind the `(`, whitespace aside, makes the parentheses hold code: the string is the address, and a comment written behind it is a comment, which is how Sass reads it and how the plain-CSS tokenizer reads it where the mark stands against the parenthesis. Everything else is a bare address, whose `//` is a character of it under every compiler, and which the first `)` no escape holds closes — `postcss-scss` alone counts parentheses there, and no compiler takes the text it thereby reads.
 *
 * The whitespace in front of the mark is {@link OPENS_WITH_QUOTE}'s, which is wider than the tokenizer's: a no-break space, a vertical tab and a line separator part the mark from the parenthesis here and not there. That is the declining side of the reading, since both callers pass a comment over, and Sass reads the comment behind all three.
 *
 * Whitespace of the tokenizer's own behind the `(` makes a block comment inside the parentheses a comment, which the `)` closing them then stands outside of ([#660](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/660)). PostCSS takes the parentheses of a lower-case `url(` as one token wherever the `(` is met by anything but a quotation mark and that whitespace; where whitespace does stand there it takes one all the same, but only while the text to the first `)` holds no break, quotation mark, parenthesis, solidus or backslash — and the opening delimiter of a comment holds a solidus. So a comment written behind that whitespace is a comment to PostCSS, to `postcss-less`, which reads by the same tokenizer, and to Sass; Less prints it as text of the address, so reading it as a comment is what declines a write under all four.
 * @param text - The text holding the call.
 * @param openIndex - Behind the `(`.
 * @returns The reading.
 */
export function readAddress (text: string, openIndex: number): Address {
	let quoted = text.slice(openIndex).match(OPENS_WITH_QUOTE)?.[0]

	if (quoted !== undefined) return { isQuoted: true, index: openIndex + quoted.length - 1, comments: [] }

	let readsComments = isWhitespace(text.charAt(openIndex))
	let comments: CommentSpan[] = []
	let index = openIndex

	while (index < text.length && text[index] !== `)`) {
		if (text[index] === `\\`) {
			index += 2
		}
		else if (readsComments && text[index] === `/` && text[index + 1] === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)
			let end = closeIndex === -1 ? text.length : closeIndex + 2

			comments.push({ start: index, end, isInline: false })
			index = end
		}
		else {
			index += 1
		}
	}

	return { isQuoted: false, index: Math.min(index, text.length), comments }
}
