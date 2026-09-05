import { CSS_LINE_BREAK, LEADING_HEX_ESCAPE } from "../../regexps.ts"

/**
 * The character an identifier spells at an index, with the escape spelling it resolved, and the index behind that spelling.
 *
 * CSS spells an escape two ways: a backslash and up to six hexadecimal digits, closed by one whitespace character belonging to the escape rather than to the text, and a backslash and any single character besides. So `\75 ` and `\u` each spell a `u`, and `\)` spells a parenthesis that closes nothing. A number no scalar answers to — zero, a surrogate, or one above the last code point — spells the replacement character, which is what CSS asks for.
 *
 * A backslash spells nothing where the text ends behind it or a line break stands there: it is a delimiter of its own then, and no character of any name. That is what an empty character says here, and it is the one answer a caller has to read rather than pass on — an escape is a character of an identifier whatever it spells, so `\/url(` names a call `/url` and `\` followed by a break leaves the `url(` behind it an address of its own.
 *
 * The break is the one the grammar counts where it asks whether a backslash opens an escape — a line feed, a carriage return, a form feed, or the Windows pair, whose carriage return is what stands behind the backslash — and not the one PostCSS counts a line by, since the question is what a backslash spells and not which line it stands on; {@link CSS_LINE_BREAK} is that reading, and `spelledRuns` asks it of the same character. A form feed and a bare carriage return used to be read as characters an escape spells, so `\` and a form feed opened a name where the grammar opens none, and the `url(` behind it was a call of that name rather than an address (#566). Sass refuses a backslash in front of any of the four alike, and lightningcss prints the four alike.
 * @param text - The text being scanned.
 * @param index - The index the character is spelled from.
 * @returns The character, or nothing where the backslash spells none, and the index behind the characters spelling it.
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
