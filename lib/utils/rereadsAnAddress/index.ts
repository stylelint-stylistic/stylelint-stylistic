import { LEADING_CSS_WHITESPACE, OPENS_WITH_QUOTE_OR_CSS_WHITESPACE } from "../../regexps.ts"
import type { Edit } from "../applyEditsFromEnd/index.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"
import { joinsTheName } from "../joinsTheName/index.ts"
import { skipString } from "../skipString/index.ts"

/**
 * Finds the `(` the tokenizer meets behind a name with the name still its last word: whitespace and comments between the two push no word.
 * @param text - The text holding the name.
 * @param nameEnd - Behind the name.
 * @returns Behind the `(`, or -1 where something else stands first.
 */
function openingParenthesisBehind (text: string, nameEnd: number): number {
	let index = nameEnd

	while (index < text.length) {
		index += (text.slice(index).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0].length

		if (!text.startsWith(`/*`, index)) break

		let commentEnd = text.indexOf(`*/`, index + 2)

		if (commentEnd === -1) return -1

		index = commentEnd + 2
	}

	return text[index] === `(` ? index + 1 : -1
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
 * Asks whether an edit makes the tokenizer read the parentheses of a `url(` right behind it the other way, where the two readings part.
 *
 * PostCSS's tokenizer, which `postcss-less` reads by too, takes the parentheses as one token, closed by the first `)` no backslash escapes, where the last word it read is `url` itself, whitespace and comments between the name and the `(` aside, and as code where that word is longer; `1,url(` and `1/url(` are one word to it, so filling or emptying the run in front of the name switches the reading. A quotation mark or whitespace right behind the `(` makes the parentheses code under both words. The readings part where no `)` closes the token, and where code reads a string, a comment or a group past that `)`, or reads a group in front of it; there the output stops parsing or swallows what follows.
 *
 * `postcss-scss`'s tokenizer ends a word on a comma outside an at-word, so such a comma's run switches nothing under it; its token counts parentheses and opens behind whitespace too, which the reading of the parts here does not model.
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

	let openIndex = openingParenthesisBehind(text, end + 3)

	if (openIndex === -1) return false

	if (joinsTheName(text.slice(0, end), reading) === joinsTheName(text.slice(0, start) + written, reading)) return false

	if (OPENS_WITH_QUOTE_OR_CSS_WHITESPACE.test(text.slice(openIndex))) return false

	let closeIndex = closingParenthesisIndex(text, openIndex)

	return closeIndex === -1 || codePartsFromToken(text, openIndex, closeIndex)
}
