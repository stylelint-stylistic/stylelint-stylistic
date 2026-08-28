import { LEADING_HEX_ESCAPE, LEADING_LINE_BREAK } from "../../regexps.js"

/**
 * The character an identifier spells at an index, with the escape spelling it resolved, and the index behind that spelling.
 *
 * CSS spells an escape two ways: a backslash and up to six hexadecimal digits, closed by one whitespace character belonging to the escape rather than to the text, and a backslash and any single character besides. So `\75 ` and `\u` each spell a `u`, and `\)` spells a parenthesis that closes nothing. A number no scalar answers to — zero, a surrogate, or one above the last code point — spells the replacement character, which is what CSS asks for.
 *
 * A backslash spells nothing where the text ends behind it or a line break stands there: it is a delimiter of its own then, and no character of any name. That is what an empty character says here, and it is the one answer a caller has to read rather than pass on — an escape is a character of an identifier whatever it spells, so `\/url(` names a call `/url` and `\` followed by a break leaves the `url(` behind it an address of its own.
 * @param {string} text - The text being scanned.
 * @param {number} index - The index the character is spelled from.
 * @returns {{ character: string | undefined, end: number }} The character, or nothing where the backslash spells none, and the index behind the characters spelling it.
 */
export function readIdentifierCharacter (text, index) {
	if (text[index] !== `\\`) return { character: text[index], end: index + 1 }

	let next = text[index + 1]

	if (next === undefined || LEADING_LINE_BREAK.test(text.slice(index + 1, index + 3))) return { character: undefined, end: index + 1 }

	let hexadecimal = text.slice(index).match(LEADING_HEX_ESCAPE)

	if (!hexadecimal) return { character: next, end: index + 2 }

	let point = Number.parseInt(hexadecimal[0].slice(1), 16)
	let isScalar = point > 0 && point <= 0x10FFFF && (point < 0xD800 || point > 0xDFFF)

	return { character: isScalar ? String.fromCodePoint(point) : `�`, end: index + hexadecimal[0].length }
}
