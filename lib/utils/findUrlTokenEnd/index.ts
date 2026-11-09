import type { CommentReading } from "../findCommentSpans/index.ts"
import { isWhitespace } from "../isWhitespace/index.ts"
import { skipString } from "../skipString/index.ts"

/**
 * Asks whether a step of a walk may end a token of `postcss-scss`'s, so that a word behind it is a word of its own: whitespace, a comma, a parenthesis, a closing brace, a string, a block comment, and an escape of anything but a solidus, which the tokenizer leaves to open the next word. A step over a name answers no. Inside an interpolation none of them ends one, which {@link findUrlTokenEnd} answers for by the braces the parentheses hold.
 * @param text - The text walked.
 * @param step - Where the step opened, or less than zero at the text's start.
 * @returns True where it does.
 */
function endsToken (text: string, step: number): boolean {
	if (step < 0) return true

	let character = text.charAt(step)

	return isWhitespace(character) || `,()[]}"'`.includes(character) || (character === `/` && text[step + 1] === `*`) || (character === `\\` && text[step + 1] !== `/`)
}

/**
 * Finds where the parentheses `postcss-scss`'s tokenizer takes as one token behind the word `url` end: the `)` balancing them, every parenthesis counted as written except one behind a backslash or inside a comment or a string, which the tokenizer does not count. It reads no comment inside, and Sass reads `\/` there as an escape, so a backslash covers the solidus of a `//` up to that end.
 *
 * A quotation mark against the parenthesis opens no such token; one behind whitespace does, since the tokenizer asks only the character behind the `(`, and the rules taking that whitespace away refuse where the `//` behind the string would become a comment. Parentheses holding a brace are read as none too, since the word may stand inside an interpolation the tokenizer reads whole, closing past them.
 * @param text - The text walked.
 * @param index - Where the word would open.
 * @param previousStep - Where the walk's step in front of it opened, or less than zero at the text's start: `\61 url(` and `#{$p}url(` hold the word, `aurl(` and `/url(` do not.
 * @param reading - What the syntax makes of a `//` comment; only a parser whose own tokenizer reads one takes such a token here.
 * @returns Behind the balancing `)`, the text's length where none balances, or `index` where no such token opens: another parser, a word that is not `url(` standing on its own, a quotation mark against the `(`, or a brace inside unclosed parentheses. Parentheses holding an interpolation still close on their balancing `)`, because the tokenizer counts them and takes the whole `url(#{…})` as one token; a `url(` standing inside an already open interpolation does not open one.
 */
export function findUrlTokenEnd (text: string, index: number, previousStep: number, reading: CommentReading): number {
	let openIndex = index + 3

	let opensUrlToken = reading.tokenizes && text.startsWith(`url(`, index) && endsToken(text, previousStep) && text[openIndex + 1] !== `"` && text[openIndex + 1] !== `'`

	if (!opensUrlToken) return index

	let depth = 0

	let position = openIndex

	for (; position < text.length; position += 1) {
		let character = text[position]

		let skipped = stepOverUrlToken(text, position)

		if (skipped !== position) {
			position = skipped
			continue
		}

		if (character === `(`) depth += 1
		else if (character === `)`) depth -= 1

		if (depth === 0) break
	}

	let end = Math.min(position + 1, text.length)

	let holdsBrace = text.slice(openIndex, end).includes(`{`) || text.slice(openIndex, end).includes(`}`)

	let result: number
	if (holdsBrace && depth === 0 && !hasOpenInterpolationBefore(text, index)) result = end
	else if (holdsBrace) result = index
	else result = end

	return result
}

/**
 * Steps over a character that the tokenizer takes no parenthesis from inside a url token: an escape covers the next character, a string holds none, and a block comment holds none. Returns the position to continue from, or the same position where nothing is skipped.
 * @param text - The text walked.
 * @param position - Where the step stands.
 * @returns The position to continue from.
 */
function stepOverUrlToken (text: string, position: number): number {
	let character = text[position]

	// An escape covers the next character, so an escaped parenthesis counts as neither
	if (character === `\\`) return position + 1

	// A string holds no parenthesis the tokenizer counts
	if (character === `"` || character === `'`) return skipString(text, position) - 1

	// A block comment holds no parenthesis the tokenizer counts
	if (character === `/` && text[position + 1] === `*`) {
		let closeIndex = text.indexOf(`*/`, position + 2)

		return closeIndex === -1 ? text.length - 1 : closeIndex + 1
	}

	return position
}

/**
 * Tells whether a not-yet-closed interpolation `#{…}` opens in front of `index` and remains open at it: walking back from `index`, a closing brace deepens the count and an opening brace behind a solidus shallows it, and the first opening brace found at count zero marks an interpolation `url(` stands inside.
 * @param text - The text walked.
 * @param index - Where `url(` opens.
 * @returns True where an interpolation opened in front of `index` has not been closed by it.
 */
function hasOpenInterpolationBefore (text: string, index: number): boolean {
	let depth = 0

	for (let at = index - 1; at >= 0; at -= 1) {
		if (text[at] === `}`) depth += 1
		else if (text[at] === `{` && at > 0 && text[at - 1] === `#`) {
			if (depth === 0) return true
			depth -= 1
		}
	}

	return false
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
