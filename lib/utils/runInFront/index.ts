import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"

/**
 * Reads the run in front of a delimiter.
 * @param text - The text the delimiter stands in.
 * @param index - The delimiter's index.
 * @returns The whitespace in front of it.
 */
export function runInFront (text: string, index: number): string {
	return (text.slice(0, index).match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0]
}
