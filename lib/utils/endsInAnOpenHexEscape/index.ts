import { TRAILING_HEX_ESCAPE } from "../../regexps.ts"
import { spelledRuns } from "../spelledRuns/index.ts"

/**
 * Asks whether a word ends in a hexadecimal escape still open to the whitespace behind it.
 *
 * The last run must be a backslash and hexadecimal digits alone: a run closed on its whitespace reaches no further, `10PX\\9` opens none, and a seventh digit is a character of its own.
 * @param word - The text of the word.
 * @returns True where the whitespace behind the word is the escape's.
 */
export function endsInAnOpenHexEscape (word: string): boolean {
	let last = spelledRuns(word).at(-1)

	return last !== undefined && last.escape && TRAILING_HEX_ESCAPE.test(last.text)
}
