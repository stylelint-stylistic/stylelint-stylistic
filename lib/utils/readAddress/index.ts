import { CRLF, OPENS_WITH_QUOTE, SASS_URL_CODE_POINT } from "../../regexps.ts"
import type { CommentReading, CommentSpan } from "../findCommentSpans/index.ts"
import { findInlineCommentEnd } from "../findInlineCommentEnd/index.ts"
import { isWhitespace } from "../isWhitespace/index.ts"
import { joinsTheName } from "../joinsTheName/index.ts"
import { readEscapedCharacter } from "../readEscapedCharacter/index.ts"
import { skipString } from "../skipString/index.ts"

/** The address a `url()`'s parentheses hold. */
export type Address = {

	/** True where a quotation mark opens it, whitespace aside: the marks are its own, and what stands behind it inside the parentheses is code. */
	isQuoted: boolean,

	/** The opening quotation mark, or the `)` closing a bare address, outside the comments and strings read inside it — the text's length where no `)` stands. */
	index: number,

	/** The comments standing inside the parentheses, which only a bare address behind whitespace, one behind a name spelled other than `url` or a sign glued to it where the parser reads no `//` of its own, or parentheses Sass reads as code, hold. */
	comments: CommentSpan[],
}

/** The comments an interpolation's expression holds, which the walk records of the kinds it reads. */
type InterpolationComments = {
	block: boolean,
	inline: boolean,
	spans: CommentSpan[],
}

/**
 * Skips a Sass interpolation, whose expression may hold braces, strings and comments of both kinds of its own.
 * @param text - The text holding the interpolation.
 * @param openIndex - The `#`.
 * @param reading - What the syntax makes of a `//` comment, which says where one inside the expression ends.
 * @param comments - Where the comments inside are recorded, of the kinds it asks for.
 * @returns Behind its closing brace, or nothing where the text never closes it.
 */
function skipInterpolation (text: string, openIndex: number, reading: CommentReading, comments?: InterpolationComments): number | undefined {
	let depth = 0
	let index = openIndex + 1

	while (index < text.length) {
		let character = text.charAt(index)

		if (character === `"` || character === `'`) {
			index += 1

			while (index < text.length && text[index] !== character) index += text[index] === `\\` ? 2 : 1
		}
		else if (character === `/` && (text[index + 1] === `*` || text[index + 1] === `/`)) {
			let isInline = text[index + 1] === `/`
			let closeIndex = text.indexOf(`*/`, index + 2)
			let blockEnd = closeIndex === -1 ? text.length : closeIndex + 2
			let commentEnd = isInline ? findInlineCommentEnd(text, index, reading) : blockEnd

			if (comments && (isInline ? comments.inline : comments.block)) comments.spans.push({ start: index, end: commentEnd, isInline })

			index = commentEnd - 1
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

	return undefined
}

/**
 * Skips what the search for the closing parenthesis reads as one piece: an escape, which Sass reads `\//` as too ([#517](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/517)), and under a parser whose own tokenizer reads `//` an interpolation the text closes, which Sass reads whole, so a `)` of a call inside it closes nothing. An interpolation nothing closes is left to the walk, since Sass refuses such a file and a comment behind the call stays readable to the guards.
 * @param text - The text holding the call.
 * @param index - Where the search stands.
 * @param reading - What the syntax makes of a `//` comment.
 * @param comments - Where the comments inside an interpolation are recorded.
 * @returns Behind the piece, or `index` where none opens.
 */
function skipWhole (text: string, index: number, reading: CommentReading, comments: InterpolationComments): number {
	if (text[index] === `\\`) return readEscapedCharacter(text, index).end

	if (reading.tokenizes && text[index] === `#` && text[index + 1] === `{`) return skipInterpolation(text, index, reading, comments) ?? index

	return index
}

/**
 * Asks whether Sass reads the parentheses of a `url()` as an unquoted address rather than as code: whitespace at either end, and in between nothing but escapes, interpolations and {@link SASS_URL_CODE_POINT} characters up to a `)`.
 * @param text - The text holding the call.
 * @param openIndex - Behind the `(`.
 * @param reading - What the syntax makes of a `//` comment.
 * @returns True where Sass reads an address.
 */
function readsAsSassAddress (text: string, openIndex: number, reading: CommentReading): boolean {
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
			index = skipInterpolation(text, index, reading) ?? text.length
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
 * Asks whether the PostCSS tokenizer, which `postcss-less` reads by too, takes the parentheses as code: behind its own whitespace, and behind any word but `url` itself unless the parser reads `//` on its own, where Sass decides. A sign the tokenizer glues to the name, as in `1/url(` or `,url(`, makes the word longer; a sign `postcss-value-parser` keeps in the word too makes no address at all, and never reaches here.
 * @param text - The text holding the call.
 * @param openIndex - Behind the `(`.
 * @param name - The name in front of the `(`, as the text spells it.
 * @param reading - What the syntax makes of a `//` comment.
 * @returns True where a block comment inside them is a comment to that tokenizer.
 */
function tokenizesAsCode (text: string, openIndex: number, name: string, reading: CommentReading): boolean {
	return isWhitespace(text.charAt(openIndex)) || (!reading.tokenizes && (name !== `url` || joinsTheName(text.slice(0, openIndex - 1 - name.length), reading)))
}

/**
 * Reads the address a `url()`'s parentheses hold, the one reading the comment walk and the `//`-comment guard both ask ([#557](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/557)).
 *
 * A quotation mark behind the `(`, whitespace aside, makes the parentheses hold code: the string is the address, and a comment written behind it is a comment, which is how Sass reads it and how the plain-CSS tokenizer reads it where the mark stands against the parenthesis. Everything else is a bare address, which the first `)` no escape holds closes, outside the comments, strings and interpolations read below — `postcss-scss` alone counts parentheses there, and no compiler takes the text it thereby reads.
 *
 * The whitespace in front of the mark is {@link OPENS_WITH_QUOTE}'s, which is wider than the tokenizer's: a no-break space, a vertical tab and a line separator part the mark from the parenthesis here and not there. That is the declining side of the reading, since both callers pass a comment over, and Sass reads the comment behind all three.
 *
 * Whitespace of the tokenizer's own behind the `(` makes a block comment inside the parentheses a comment, which the `)` closing them then stands outside of ([#660](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/660)). PostCSS takes the parentheses of a lower-case `url(` as one token wherever the `(` is met by anything but a quotation mark and that whitespace; where whitespace does stand there it takes one all the same, but only while the text to the first `)` holds no break, quotation mark, parenthesis, solidus or backslash — and the opening delimiter of a comment holds a solidus. So a comment written behind that whitespace is a comment to PostCSS, to `postcss-less`, which reads by the same tokenizer, and to Sass; Less prints it as text of the address, so reading it as a comment is what declines a write under all four.
 *
 * The same holds behind a name spelled other than `url`, `URL(`, `u\rl(` or `\75 rl(`, and behind a sign the tokenizer glues to the name, `1/url(` or `,url(`: the tokenizer asks the word it read last for `url` itself and meets these parentheses as those of any call, which a solidus makes code, so a block comment inside them is a comment to it and a write must not enter it ([#664](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/664)). Under `postcss-scss` Sass decides instead, since the parser's comment read where Sass reads an address hid the `//` comment Sass reads behind the address.
 *
 * Wherever a comment is read inside the parentheses, a quotation mark the text closes opens a string, whose comment delimiters and `)` are its text: PostCSS and `postcss-less` read the string in `url( a "/*)" b)` so, and Sass reads it so with or without the whitespace, while `postcss-scss`, which takes the parentheses of `url(` as one token, reads no comment inside the string either.
 *
 * Under a parser whose own tokenizer reads `//`, which is `postcss-scss`, the parentheses Sass reads as code rather than as an unquoted address ({@link readsAsSassAddress}) hold comments of both kinds, and the first `)` no comment or string covers closes them ([#661](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/661)). Under that parser an interpolation the text closes is read whole in either kind of parentheses, comments inside it included, so a `)` of a call inside it closes nothing. Less reads an address there, and a block comment read where it reads one would hide a `//` comment of its own, so no other syntax reads Sass's way.
 * @param text - The text holding the call.
 * @param openIndex - Behind the `(`.
 * @param name - The name in front of the `(`, as the text spells it.
 * @param reading - What the syntax makes of a `//` comment.
 * @returns The reading.
 */
export function readAddress (text: string, openIndex: number, name: string, reading: CommentReading): Address {
	let quoted = text.slice(openIndex).match(OPENS_WITH_QUOTE)?.[0]

	if (quoted !== undefined) return { isQuoted: true, index: openIndex + quoted.length - 1, comments: [] }

	let isSassCode = reading.tokenizes && !readsAsSassAddress(text, openIndex, reading)
	let readsBlockComments = isSassCode || tokenizesAsCode(text, openIndex, name, reading)
	let readsInlineComments = isSassCode && reading.spells
	let comments: CommentSpan[] = []
	// A comment inside an interpolation is recorded as one the walk would have met outside it
	let interpolationComments = { block: readsBlockComments, inline: readsInlineComments, spans: comments }
	let index = openIndex

	while (index < text.length && text[index] !== `)`) {
		let behindWhole = skipWhole(text, index, reading, interpolationComments)

		if (behindWhole !== index) {
			index = behindWhole
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
