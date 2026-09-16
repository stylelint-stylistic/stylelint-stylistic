import { OPENS_WITH_QUOTE } from "../../regexps.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"
import { isWhitespace } from "../isWhitespace/index.ts"
import { skipString } from "../skipString/index.ts"

/**
 * Asks whether a step of a walk may end a token of `postcss-scss`'s, so that a word behind it is a word of its own: whitespace, a comma, a parenthesis, a closing brace, and an escape of anything but a solidus, which the tokenizer leaves to open the next word. A step over a string, a comment or a name answers no, which only keeps a comment read behind it. Inside an interpolation none of them ends one, which {@link findUrlTokenEnd} answers for by the braces the parentheses hold.
 * @param text - The text walked.
 * @param step - Where the step opened, or less than zero at the text's start.
 * @returns True where it does.
 */
function endsToken (text: string, step: number): boolean {
	if (step < 0) return true

	let character = text.charAt(step)

	return isWhitespace(character) || `,()}`.includes(character) || (character === `\\` && text[step + 1] !== `/`)
}

/**
 * Finds where the parentheses `postcss-scss`'s tokenizer takes as one token behind the word `url` end: the `)` balancing them, every parenthesis counted as written, since the tokenizer counts one behind a backslash or inside a comment or a string alike. It reads no comment inside, and Sass reads `\/` there as an escape, so a backslash covers the solidus of a `//` up to that end.
 *
 * A quotation mark against the parenthesis opens no such token, and one behind whitespace is read as opening none either: `function-parentheses-space-inside` takes that whitespace away, and the `//` behind the string becomes a comment the fix wrote the file into. Parentheses holding a brace are read as none too, since the word may stand inside an interpolation the tokenizer reads whole, closing past them.
 * @param text - The text walked.
 * @param index - Where the word would open.
 * @param previousStep - Where the walk's step in front of it opened, or less than zero at the text's start: `\61 url(` and `#{$p}url(` hold the word, `aurl(` and `/url(` do not.
 * @param reading - What the syntax makes of a `//` comment; only a parser whose own tokenizer reads one takes such a token here.
 * @returns Behind the balancing `)`, the text's length where none balances, or `index` where no such token opens: another parser, a word that is not `url(` standing on its own, a quotation mark opening the parentheses, whitespace aside, or a brace inside them.
 */
export function findUrlTokenEnd (text: string, index: number, previousStep: number, reading: CommentReading): number {
	let openIndex = index + 3

	if (!reading.tokenizes || !text.startsWith(`url(`, index) || !endsToken(text, previousStep) || OPENS_WITH_QUOTE.test(text.slice(openIndex + 1))) return index

	let depth = 0

	let position = openIndex

	for (; position < text.length; position += 1) {
		if (text[position] === `(`) depth += 1
		else if (text[position] === `)`) depth -= 1

		if (depth === 0) break
	}

	let end = Math.min(position + 1, text.length)

	return text.slice(openIndex, end).includes(`{`) || text.slice(openIndex, end).includes(`}`) ? index : end
}

/**
 * Picks the reading a backslash is read by: none inside a url token ({@link findUrlTokenEnd}), where the tokenizer reads no comment and Sass reads `\/` as an escape, so the backslash covers the solidus of a `//`.
 * @param index - The backslash.
 * @param urlTokenEnd - Where the url token the walk stands in ends.
 * @param reading - What the syntax makes of a `//` comment.
 * @returns The reading, or nothing inside the token.
 */
export function escapeReading (index: number, urlTokenEnd: number, reading: CommentReading): CommentReading | undefined {
	return index < urlTokenEnd ? undefined : reading
}

/**
 * Skips a string, which the url token it opens inside cuts at the token's end: the tokenizer reads no string there, so the `)` closing the token closes the string too, and what stands behind it is code to the tokenizer.
 * @param text - The text walked.
 * @param index - The opening quotation mark.
 * @param urlTokenEnd - Where the url token the walk stands in ends.
 * @returns Behind the string, as {@link skipString} reads it, or the token's end.
 */
export function skipStringInUrlToken (text: string, index: number, urlTokenEnd: number): number {
	let end = skipString(text, index)

	return index < urlTokenEnd ? Math.min(end, urlTokenEnd) : end
}
