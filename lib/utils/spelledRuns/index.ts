import { CSS_LINE_BREAK, LEADING_HEX_ESCAPE } from "../../regexps.ts"

/** One run: index, text, and whether it is an escape, whose hidden character is a code point of the identifier rather than a token. */
export type SpelledRun = {
	index: number,
	text: string,
	escape: boolean,
}

/**
 * Reads a text run by run, as a tokenizer does: one character, or an escape — a backslash and the next character, or a backslash, up to six hexadecimal digits and the whitespace character closing them.
 *
 * The backslashes decide what is code: `10PX*2REM` is two dimensions, `10PX\*2REM` one whose unit is `PX\*2REM`; a run of one is never taken for the code it hides.
 *
 * A backslash before a line break opens no escape: the identifier ends there, though `postcss-value-parser` keeps the break in the word. One closing the text does: the tokenizer reads it as a replacement character.
 *
 * The whitespace closing a hexadecimal escape belongs to it: `10P\61 X` holds the five runs `10PaX` does, and a word holds that space only where `postcss-value-parser`'s parts have been welded again ([#526](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526)). A seventh digit is its own character; a Windows pair closes it as one break.
 * @param text - The identifier or value text read run by run.
 * @returns The runs.
 */
export function spelledRuns (text: string): SpelledRun[] {
	let runs: SpelledRun[] = []
	let index = 0

	while (index < text.length) {
		// Code unit by code unit, as `IDENTIFIER_CODE_POINT` answers
		let character = text.charAt(index)
		let behind = text.charAt(index + 1)
		let escape = character === `\\` && !CSS_LINE_BREAK.test(behind)
		let length = escape ? text.slice(index).match(LEADING_HEX_ESCAPE)?.[0].length ?? 2 : 1

		runs.push({ index, text: text.slice(index, index + length), escape })
		index += length
	}

	return runs
}
