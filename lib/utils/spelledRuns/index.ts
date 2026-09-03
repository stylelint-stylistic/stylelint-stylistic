import { CSS_LINE_BREAK } from "../../regexps.ts"

/** One run of a text as the file spells it: where it stands, what it is, and whether it is an escape — which is to say whether the character it hides is a code point of the identifier it stands in rather than the token it would otherwise be. */
export type SpelledRun = {
	index: number,
	text: string,
	escape: boolean,
}

/**
 * Reads a text run by run, the way a tokenizer reads one: a run is a single character, or a backslash and the character it escapes.
 *
 * What is code and what is a name turns on where the backslashes stand and how many of them there are. `@csstools/css-tokenizer` reads `10PX*2REM` as two dimensions with a star between them and `10PX\*2REM` as one dimension whose unit is `PX\*2REM`; Sass multiplies the first and leaves the second whole; `lightningcss` recases the units of the first and prints the second exactly as it stands. A caller asking about a character asks about a run of one, so no escaped character is ever taken for the code it hides.
 *
 * A backslash opens no escape where a line break stands behind it: the grammar reads it as a delimiter of its own, and the identifier ends in front of it. `postcss-value-parser` has no such reading — it steps over whatever follows a backslash and keeps the break inside the word — so a word reaching this can carry one. A backslash closing the text does open one, reaching nothing: the tokenizer consumes such a backslash into the identifier as a replacement character, so `10PX\` is one dimension whose unit ends in that backslash.
 *
 * A hexadecimal escape reaches further than the one character, `\61 ` being the letter `a` and the whitespace closing it, but every character it reaches over is a hexadecimal digit or that whitespace, and a caller asking about one of those would be asking about a character of a number rather than of the text around it.
 * @param text - The text to read.
 * @returns Every run, in the order the text spells them.
 */
export function spelledRuns (text: string): SpelledRun[] {
	let runs: SpelledRun[] = []
	let index = 0

	while (index < text.length) {
		// One UTF-16 code unit at a time, so that each half of a surrogate pair stands on its own and a question about the code points of an identifier is asked the way `IDENTIFIER_CODE_POINT` answers it
		let character = text.charAt(index)
		let behind = text.charAt(index + 1)
		let escape = character === `\\` && !CSS_LINE_BREAK.test(behind)
		let length = escape ? 2 : 1

		runs.push({ index, text: text.slice(index, index + length), escape })
		index += length
	}

	return runs
}
