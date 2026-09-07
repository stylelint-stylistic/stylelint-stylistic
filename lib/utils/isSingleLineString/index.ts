import { LINE_BREAK } from "../../regexps.ts"

/**
 * Answers whether a text holds no line feed, bare or behind a carriage return; a bare carriage return or form feed is single-line to every `*-single-line` option.
 * @param input - The text.
 * @returns True where it holds none.
 */
export function isSingleLineString (input: string): boolean {
	return !LINE_BREAK.test(input)
}
