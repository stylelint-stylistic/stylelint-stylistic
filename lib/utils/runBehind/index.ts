import { LEADING_CSS_WHITESPACE } from "../../regexps.ts"

/**
 * Reads the run behind a delimiter.
 * @param text - The text the delimiter stands in.
 * @param index - The delimiter's index.
 * @returns The whitespace behind it.
 */
export function runBehind (text: string, index: number): string {
	return (text.slice(index + 1).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]
}
