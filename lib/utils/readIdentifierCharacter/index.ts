import { CSS_LINE_BREAK, LEADING_HEX_ESCAPE } from "../../regexps.ts"

/**
 * The character an identifier spells at an index, with any escape resolved, and the index behind it.
 *
 * An escape is a backslash and up to six hex digits, closed by one whitespace character belonging to the escape, or a backslash and any other single character: `\75 ` and `\u` spell `u`. A number that is no scalar spells the replacement character.
 *
 * A backslash at the end of the text or in front of a line break spells nothing and is a delimiter, the one answer a caller has to read rather than pass on: `\` and a break leave the `url(` behind them an address of its own. The break is the grammar's, {@link CSS_LINE_BREAK}, not PostCSS's: a form feed read as an escaped character once opened a name where the grammar opens none ([#566](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/566)).
 * @param text - The identifier's source.
 * @param index - The index the character is spelled from.
 * @returns The character, or nothing where the backslash spells none, and the index behind it.
 */
export function readIdentifierCharacter (text: string, index: number): {
	character: string | undefined,
	end: number,
} {
	if (text[index] !== `\\`) return { character: text[index], end: index + 1 }

	let next = text[index + 1]

	if (next === undefined || CSS_LINE_BREAK.test(next)) return { character: undefined, end: index + 1 }

	let hexadecimal = text.slice(index).match(LEADING_HEX_ESCAPE)

	if (!hexadecimal) return { character: next, end: index + 2 }

	let point = Number.parseInt(hexadecimal[0].slice(1), 16)
	let isScalar = point > 0 && point <= 0x10FFFF && (point < 0xD800 || point > 0xDFFF)

	return { character: isScalar ? String.fromCodePoint(point) : `�`, end: index + hexadecimal[0].length }
}
