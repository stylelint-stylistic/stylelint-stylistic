import { CRLF, OPENS_WITH_QUOTE, SASS_URL_CODE_POINT } from "../../regexps.ts"
import type { CommentReading, CommentSpan } from "../findCommentSpans/index.ts"
import { findInlineCommentEnd } from "../findInlineCommentEnd/index.ts"
import { isWhitespace } from "../isWhitespace/index.ts"
import { readEscapedCharacter } from "../readEscapedCharacter/index.ts"
import { skipString } from "../skipString/index.ts"

/** The address a `url()`'s parentheses hold. */
export type Address = {

	/** True where a quotation mark opens it, whitespace aside: the marks are its own, and what stands behind it inside the parentheses is code. */
	isQuoted: boolean,

	/** The opening quotation mark, or the `)` closing a bare address, outside the comments and strings read inside it — the text's length where no `)` stands. */
	index: number,

	/** The comments standing inside the parentheses, which only a bare address behind whitespace, one behind a name spelled other than `url` where the parser reads no `//` of its own, or parentheses Sass reads as code, hold. */
	comments: CommentSpan[],
}

/**
 * Skips a Sass interpolation, whose expression may hold braces, strings and block comments of its own.
 * @param text - The text holding the interpolation.
 * @param openIndex - The `#`.
 * @returns Behind its closing brace, or the text's length.
 */
function skipInterpolation (text: string, openIndex: number): number {
	let depth = 0
	let index = openIndex + 1

	while (index < text.length) {
		let character = text.charAt(index)

		if (character === `"` || character === `'`) {
			index += 1

			while (index < text.length && text[index] !== character) index += text[index] === `\\` ? 2 : 1
		}
		else if (character === `/` && text[index + 1] === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)

			index = closeIndex === -1 ? text.length : closeIndex + 1
		}
		else if (character === `{`) {
			depth += 1
		}
		else if (character === `}`) {
			depth -= 1

			if (depth === 0) return index + 1
		}

		index += 1
	}

	return text.length
}

/**
 * Asks whether Sass reads the parentheses of a `url()` as an unquoted address rather than as code: whitespace at either end, and in between nothing but escapes, interpolations and {@link SASS_URL_CODE_POINT} characters up to a `)`.
 * @param text - The text holding the call.
 * @param openIndex - Behind the `(`.
 * @returns True where Sass reads an address.
 */
function readsAsSassAddress (text: string, openIndex: number): boolean {
	let index = openIndex

	while (isWhitespace(text.charAt(index))) index += 1

	while (index < text.length) {
		let character = text.charAt(index)

		if (character === `)`) return true

		if (character === `\\`) {
			let { end } = readEscapedCharacter(text, index)

			// Sass ends a hexadecimal escape on one whitespace character, and the line feed of a Windows pair is a second
			index = CRLF.test(text.slice(end - 2, end)) ? end - 1 : end
		}
		else if (character === `#` && text[index + 1] === `{`) {
			index = skipInterpolation(text, index)
		}
		else if (isWhitespace(character)) {
			while (isWhitespace(text.charAt(index))) index += 1

			return index === text.length || text[index] === `)`
		}
		else if (SASS_URL_CODE_POINT.test(character)) {
			index += 1
		}
		else {
			return false
		}
	}

	// A text cut short inside the address, which the file may close behind it
	return true
}

/**
 * Asks whether the PostCSS tokenizer, which `postcss-less` reads by too, takes the parentheses as code: behind its own whitespace, and behind any name but the word `url` itself unless the parser reads `//` on its own, where Sass decides.
 * @param text - The text holding the call.
 * @param openIndex - Behind the `(`.
 * @param name - The name in front of the `(`, as the text spells it.
 * @param reading - What the syntax makes of a `//` comment.
 * @returns True where a block comment inside them is a comment to that tokenizer.
 */
function tokenizesAsCode (text: string, openIndex: number, name: string, reading: CommentReading): boolean {
	return isWhitespace(text.charAt(openIndex)) || (!reading.tokenizes && name !== `url`)
}

/**
 * Reads the address a `url()`'s parentheses hold, the one reading the comment walk and the `//`-comment guard both ask ([#557](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/557)).
 *
 * A quotation mark behind the `(`, whitespace aside, makes the parentheses hold code: the string is the address, and a comment written behind it is a comment, which is how Sass reads it and how the plain-CSS tokenizer reads it where the mark stands against the parenthesis. Everything else is a bare address, which the first `)` no escape holds closes, outside the comments and strings read below — `postcss-scss` alone counts parentheses there, and no compiler takes the text it thereby reads.
 *
 * The whitespace in front of the mark is {@link OPENS_WITH_QUOTE}'s, which is wider than the tokenizer's: a no-break space, a vertical tab and a line separator part the mark from the parenthesis here and not there. That is the declining side of the reading, since both callers pass a comment over, and Sass reads the comment behind all three.
 *
 * Whitespace of the tokenizer's own behind the `(` makes a block comment inside the parentheses a comment, which the `)` closing them then stands outside of ([#660](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/660)). PostCSS takes the parentheses of a lower-case `url(` as one token wherever the `(` is met by anything but a quotation mark and that whitespace; where whitespace does stand there it takes one all the same, but only while the text to the first `)` holds no break, quotation mark, parenthesis, solidus or backslash — and the opening delimiter of a comment holds a solidus. So a comment written behind that whitespace is a comment to PostCSS, to `postcss-less`, which reads by the same tokenizer, and to Sass; Less prints it as text of the address, so reading it as a comment is what declines a write under all four.
 *
 * The same holds behind a name spelled other than `url`, `URL(`, `u\rl(` or `\75 rl(`: the tokenizer asks the word it read last for `url` itself and meets these parentheses as those of any call, which a solidus makes code, so a block comment inside them is a comment to it and a write must not enter it ([#664](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/664)). Under `postcss-scss` Sass decides instead, since the parser's comment read where Sass reads an address hid the `//` comment Sass reads behind the address.
 *
 * Wherever a comment is read inside the parentheses, a quotation mark the text closes opens a string, whose comment delimiters and `)` are its text: PostCSS and `postcss-less` read the string in `url( a "/*)" b)` so, and Sass reads it so with or without the whitespace, while `postcss-scss`, which takes the parentheses of `url(` as one token, reads no comment inside the string either.
 *
 * Under a parser whose own tokenizer reads `//`, which is `postcss-scss`, the parentheses Sass reads as code rather than as an unquoted address ({@link readsAsSassAddress}) hold comments of both kinds, and the first `)` no comment or string covers closes them ([#661](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/661)). Less reads an address there, and a block comment read where it reads one would hide a `//` comment of its own, so no other syntax reads Sass's way.
 * @param text - The text holding the call.
 * @param openIndex - Behind the `(`.
 * @param name - The name in front of the `(`, as the text spells it.
 * @param reading - What the syntax makes of a `//` comment.
 * @returns The reading.
 */
export function readAddress (text: string, openIndex: number, name: string, reading: CommentReading): Address {
	let quoted = text.slice(openIndex).match(OPENS_WITH_QUOTE)?.[0]

	if (quoted !== undefined) return { isQuoted: true, index: openIndex + quoted.length - 1, comments: [] }

	let isSassCode = reading.tokenizes && !readsAsSassAddress(text, openIndex)
	let readsBlockComments = isSassCode || tokenizesAsCode(text, openIndex, name, reading)
	let readsInlineComments = isSassCode && reading.spells
	let comments: CommentSpan[] = []
	let index = openIndex

	while (index < text.length && text[index] !== `)`) {
		if (text[index] === `\\`) {
			// Sass decides inside these parentheses, and it reads `\//` as an escape (#517)
			index = readEscapedCharacter(text, index).end
		}
		else if (readsBlockComments && (text[index] === `"` || text[index] === `'`)) {
			let end = skipString(text, index)

			// A mark nothing closes stays a character, since every compiler refuses such a file and a comment behind the call stays readable to the guards
			index = end > text.length ? index + 1 : end
		}
		else if (readsBlockComments && text[index] === `/` && text[index + 1] === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)
			let end = closeIndex === -1 ? text.length : closeIndex + 2

			comments.push({ start: index, end, isInline: false })
			index = end
		}
		else if (readsInlineComments && text[index] === `/` && text[index + 1] === `/`) {
			let end = findInlineCommentEnd(text, index, reading)

			comments.push({ start: index, end, isInline: true })
			index = end
		}
		else {
			index += 1
		}
	}

	return { isQuoted: false, index: Math.min(index, text.length), comments }
}
