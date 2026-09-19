import { INLINE_COMMENT_BREAK_OR_FORM_FEED, LEADING_WORDLESS_TOKEN, OPENS_WITH_QUOTE_OR_CSS_WHITESPACE, POSTCSS_WORD_END, SCSS_PLAIN_BRACKETS_BREAKER, SCSS_WORD_END } from "../../regexps.ts"
import type { Edit } from "../applyEditsFromEnd/index.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"
import { joinsTheName } from "../joinsTheName/index.ts"
import { skipString } from "../skipString/index.ts"

/**
 * Reads a word as the tokenizer does: its first character is its own whatever it is, and it ends in front of the next character that opens a token.
 * @param text - The text holding the word.
 * @param index - The word's first character.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns Behind the word.
 */
function wordEnd (text: string, index: number, reading: Pick<CommentReading, `tokenizes`>): number {
	let ahead = text.slice(index + 1).search(reading.tokenizes ? SCSS_WORD_END : POSTCSS_WORD_END)

	return ahead === -1 ? text.length : index + 1 + ahead
}

/**
 * Reads the token at a position that pushes no word: whitespace, a comment, a string, an at-word, an escape, a `)` and a character read as a token of its own, with a comma, an interpolation and a `//` comment among them under `postcss-scss`'s tokenizer.
 * @param text - The text holding the token.
 * @param index - The token's first character.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns Behind the token, nothing where a word stands there, or -1 where a comment nothing closes does.
 */
function wordlessTokenEnd (text: string, index: number, reading: Pick<CommentReading, `tokenizes`>): number | undefined {
	let character = text[index]
	let rest = text.slice(index)

	if (character === `"` || character === `'`) return reading.tokenizes ? skipScssString(text, index) : skipString(text, index)

	if (rest.startsWith(`/*`)) {
		let commentEnd = text.indexOf(`*/`, index + 2)

		return commentEnd === -1 ? -1 : commentEnd + 2
	}

	if (reading.tokenizes && rest.startsWith(`//`)) {
		let breakIndex = rest.search(INLINE_COMMENT_BREAK_OR_FORM_FEED)

		return breakIndex === -1 ? -1 : index + breakIndex
	}

	if (reading.tokenizes && rest.startsWith(`#{`)) return skipScssInterpolation(text, index)

	if (character === `)` || (reading.tokenizes && character === `,`)) return index + 1

	let token = rest.match(LEADING_WORDLESS_TOKEN)

	return token === null ? undefined : index + token[0].length
}

/**
 * Reads the parentheses at which the tokenizer popped a word, or found none to pop: it passes over them where it takes them as one token, and steps inside where it reads them as code, whose own words it pushes in their turn.
 *
 * A `url` popped here opens a token of its own, closed by the first `)` no backslash escapes under PostCSS and by the count of parentheses under `postcss-scss`, unless a quotation mark right behind the `(` keeps the parentheses code — under PostCSS's tokenizer whitespace keeps them code as well. Other parentheses are one token only while the text to their first `)` holds no character breaking it, and PostCSS reads every `(` to that text's end as code once one of them is read that way (`lastBadParen`), where `postcss-scss` asks afresh at each one.
 * @param text - The text holding the parentheses.
 * @param openIndex - The `(`.
 * @param popped - The word the `(` popped, or nothing where the stack held none.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param codeEnd - How far the run of parentheses PostCSS reads as code reaches.
 * @returns Where the walk goes on and how far that run then reaches, or nothing where no `)` closes a token the tokenizer opened.
 */
function readPoppedParentheses (text: string, openIndex: number, popped: string | undefined, reading: Pick<CommentReading, `tokenizes`>, codeEnd: number): { codeEnd: number, index: number } | undefined {
	let behind = text[openIndex + 1]
	let keepsThemCode = reading.tokenizes ? behind === `"` || behind === `'` : OPENS_WITH_QUOTE_OR_CSS_WHITESPACE.test(text.slice(openIndex + 1))

	if (popped === `url` && !keepsThemCode) {
		let tokenEnd = reading.tokenizes ? scssTokenClosingIndex(text, openIndex + 1) : closingParenthesisIndex(text, openIndex + 1)

		return tokenEnd === -1 ? undefined : { codeEnd, index: tokenEnd + 1 }
	}

	let closeIndex = text.indexOf(`)`, openIndex + 1)
	let readsAsCode = openIndex <= codeEnd || closeIndex === -1 || SCSS_PLAIN_BRACKETS_BREAKER.test(text.slice(openIndex, closeIndex + 1))

	if (!readsAsCode) return { codeEnd, index: closeIndex + 1 }

	return { codeEnd: reading.tokenizes || openIndex <= codeEnd ? codeEnd : (closeIndex === -1 ? text.length : closeIndex), index: openIndex + 1 }
}

/**
 * Finds the `(` at which the tokenizer pops the name itself off the stack of words it keeps.
 *
 * The tokenizer pushes every word it reads and pops one word at each `(`, and the word popped there is the one deciding whether the parentheses open a token: a word popped by one `(` is gone from the next, so `url x(y)(a` opens a token at the second `(` (1789646980). The tokens pushing no word are {@link wordlessTokenEnd}'s, while any other is a word. The name is the word a `(` pops only where that word ends right behind the name: a letter there joins the name into a longer word, and a plain token holding the name never pushes it at all.
 *
 * The whole text is read, from its opening rather than from the name, since both the stack and the reading of parentheses carry state ({@link readPoppedParentheses}). The text is read as it is spelled, so that a break written into a token is asked about too.
 * @param text - The text holding the name.
 * @param nameEnd - Behind the name.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns Behind the `(`, or -1 where nothing pops the name.
 */
function openingParenthesisBehind (text: string, nameEnd: number, reading: Pick<CommentReading, `tokenizes`>): number {
	let stack: { end: number, text: string }[] = []
	let codeEnd = -1
	let index = 0

	while (index < text.length) {
		if (text[index] === `(`) {
			let popped = stack.pop()

			// The name is the word this parenthesis pops, so these are the parentheses asked about
			if (popped?.end === nameEnd) return index + 1

			let read = readPoppedParentheses(text, index, popped?.text, reading, codeEnd)

			if (!read) return -1

			codeEnd = read.codeEnd
			index = read.index

			continue
		}

		let step = wordlessTokenEnd(text, index, reading)

		if (step === -1) return -1

		if (step === undefined) {
			let end = wordEnd(text, index, reading)

			stack.push({ end, text: text.slice(index, end) })
			index = end
		}
		else index = step
	}

	return -1
}

/**
 * Finds the first `)` no backslash escapes, where PostCSS's tokenizer closes a bare address.
 * @param text - The text holding the address.
 * @param openIndex - Behind the `(`.
 * @returns Its index, or -1 where none stands.
 */
function closingParenthesisIndex (text: string, openIndex: number): number {
	for (let index = text.indexOf(`)`, openIndex); index !== -1; index = text.indexOf(`)`, index + 1)) {
		let backslashes = 0

		while (text[index - 1 - backslashes] === `\\`) backslashes += 1

		if (backslashes % 2 === 0) return index
	}

	return -1
}

/**
 * Asks whether the parentheses of a `url(` read as code come apart from the same parentheses read as one token closed at a `)`: a string or a comment covering that `)` or never closed, or an opening parenthesis or square bracket in front of that `)`, which code reads as a group of its own the token does not.
 * @param text - The text holding the address.
 * @param openIndex - Behind the `(`.
 * @param closeIndex - The `)` closing the token.
 * @returns True where the two readings part.
 */
function codePartsFromToken (text: string, openIndex: number, closeIndex: number): boolean {
	let index = openIndex

	while (index < closeIndex) {
		let character = text.charAt(index)

		if (character === `\\`) {
			index += 2
		}
		else if (character === `"` || character === `'`) {
			index = skipString(text, index)

			if (index > closeIndex) return true
		}
		else if (character === `/` && text[index + 1] === `*`) {
			let commentEnd = text.indexOf(`*/`, index + 2)

			if (commentEnd === -1 || commentEnd + 2 > closeIndex) return true

			index = commentEnd + 2
		}
		else if (character === `(` || character === `[`) {
			return true
		}
		else {
			index += 1
		}
	}

	return false
}

/**
 * Finds the `)` closing the parentheses `postcss-scss`'s tokenizer takes as one token behind `url`: it counts parentheses alone, through strings, comments, interpolations and escapes.
 * @param text - The text holding the address.
 * @param openIndex - Behind the `(`.
 * @returns The `)` at which the count returns to zero, or -1 where it never does.
 */
function scssTokenClosingIndex (text: string, openIndex: number): number {
	let depth = 1

	for (let index = openIndex; index < text.length; index += 1) {
		if (text[index] === `(`) depth += 1
		else if (text[index] === `)`) depth -= 1

		if (depth === 0) return index
	}

	return -1
}

/**
 * Skips a Sass interpolation as `postcss-scss`'s tokenizer reads one: a string inside it, with its escapes, and a nested interpolation are its text.
 * @param text - The text holding the interpolation.
 * @param openIndex - The `#`.
 * @returns Behind its closing brace, or the text's length where nothing closes it.
 */
function skipScssInterpolation (text: string, openIndex: number): number {
	let depth = 1
	let index = openIndex + 2

	while (index < text.length) {
		let character = text[index]

		if (character === `"` || character === `'`) {
			index = skipString(text, index)

			continue
		}

		if (character === `}`) {
			depth -= 1

			if (depth === 0) return index + 1
		}
		else if (character === `#` && text[index + 1] === `{`) {
			depth += 1
		}

		index += 1
	}

	return text.length
}

/**
 * Skips a string as `postcss-scss`'s tokenizer reads one: an escaped quotation mark closes nothing, and an interpolation inside it is its text, strings of its own included.
 * @param text - The text holding the string.
 * @param openIndex - The opening quote.
 * @returns Behind the closing quote, or one past the text's end where no quote closes it.
 */
function skipScssString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) {
		if (text[index] === `\\`) index += 2
		else if (text[index] === `#` && text[index + 1] === `{`) index = skipScssInterpolation(text, index)
		else index += 1
	}

	return index + 1
}

/**
 * Finds the `)` closing the parentheses of a `url(` read as code by `postcss-scss`'s tokenizer and parser: outside a string, a block or `//` comment, an interpolation and an escape, a parenthesis or a square bracket opens a group the parser closes only at its own closer, and a `)` inside a square-bracket group closes nothing.
 * @param text - The text holding the address.
 * @param openIndex - Behind the `(`.
 * @returns The closing `)`, or -1 where nothing closes the parentheses.
 */
function scssCodeClosingIndex (text: string, openIndex: number): number {
	let closers = [`)`]
	let index = openIndex

	while (index < text.length) {
		let character = text[index]

		if (character === `\\`) {
			index += 2
		}
		else if (character === `"` || character === `'`) {
			index = skipScssString(text, index)
		}
		else if (character === `/` && text[index + 1] === `*`) {
			let commentEnd = text.indexOf(`*/`, index + 2)

			if (commentEnd === -1) return -1

			index = commentEnd + 2
		}
		else if (character === `/` && text[index + 1] === `/`) {
			let breakIndex = text.slice(index).search(INLINE_COMMENT_BREAK_OR_FORM_FEED)

			if (breakIndex === -1) return -1

			index += breakIndex
		}
		else if (character === `#` && text[index + 1] === `{`) {
			index = skipScssInterpolation(text, index)
		}
		else {
			if (character === `(` || character === `[`) {
				closers.push(character === `(` ? `)` : `]`)
			}
			else if (character === closers.at(-1)) {
				closers.pop()

				if (closers.length === 0) return index
			}

			index += 1
		}
	}

	return -1
}

/**
 * Asks whether an edit makes the tokenizer read the parentheses of a `url(` right behind it the other way, where the two readings part.
 *
 * PostCSS's tokenizer, which `postcss-less` reads by too, takes the parentheses as one token, closed by the first `)` no backslash escapes, where the word it pops at the `(` is `url` itself ({@link openingParenthesisBehind}), and as code where that word is longer; `1,url(` and `1/url(` are one word to it, so filling or emptying the run in front of the name switches the reading. A quotation mark or whitespace right behind the `(` makes the parentheses code under both words. The readings part where no `)` closes the token, and where code reads a string, a comment or a group past that `)`, or reads a group in front of it; there the output stops parsing or swallows what follows.
 *
 * `postcss-scss`'s tokenizer ends a word on a comma outside an at-word, so such a comma's run switches nothing under it, and a comma, an interpolation or a `//` comment between the name and the `(` pushes no word under it either. Its token opens behind whitespace too, a quotation mark right behind the `(` alone keeping the parentheses code, and closes where the count of parentheses returns to zero, through strings, comments and interpolations alike; so under it the readings part where the `)` code closes the parentheses at, a square-bracket group and the parser's reading of a `;` behind the token counted in, is not that one, or where the count never returns to zero (1789574294). A `)` the token closes at in front of code's, such as an escaped one, is refused with the rest, since a `;` or a brace between the two ends the declaration once the token has closed.
 * @param text - The text the edit applies to.
 * @param edit - The edit, indexed in that text.
 * @param edit.start - Where the span it replaces opens.
 * @param edit.end - Where that span closes.
 * @param edit.text - What it writes there.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns True where the edit switches the reading of parentheses whose two readings part.
 */
export function rereadsAnAddress (text: string, { start, end, text: written }: Edit, reading: Pick<CommentReading, `tokenizes`>): boolean {
	if (!text.startsWith(`url`, end)) return false

	let edited = text.slice(0, start) + written + text.slice(end)
	let editedEnd = start + written.length
	let openIndex = openingParenthesisBehind(text, end + 3, reading)
	let editedOpenIndex = openingParenthesisBehind(edited, editedEnd + 3, reading)

	// The name is the last word at the `(` under a spelling where nothing joins it and no plain token in front holds it, and a break written into such a token breaks it
	let isLastWord = openIndex !== -1 && !joinsTheName(text.slice(0, end), reading)
	let editedIsLastWord = editedOpenIndex !== -1 && !joinsTheName(edited.slice(0, editedEnd), reading)

	if (isLastWord === editedIsLastWord) return false

	if (openIndex === -1) openIndex = editedOpenIndex - (editedEnd - end)

	if (reading.tokenizes) {
		if (text[openIndex] === `"` || text[openIndex] === `'`) return false

		// The parentheses the tokenizer reads as one plain token under either word, since nothing inside them opens a string, a comment, an escape or a group
		if (!SCSS_PLAIN_BRACKETS_BREAKER.test(text.slice(openIndex, text.indexOf(`)`, openIndex) + 1))) return false

		let tokenCloseIndex = scssTokenClosingIndex(text, openIndex)

		return tokenCloseIndex === -1 || tokenCloseIndex !== scssCodeClosingIndex(text, openIndex)
	}

	if (OPENS_WITH_QUOTE_OR_CSS_WHITESPACE.test(text.slice(openIndex))) return false

	let closeIndex = closingParenthesisIndex(text, openIndex)

	return closeIndex === -1 || codePartsFromToken(text, openIndex, closeIndex)
}
