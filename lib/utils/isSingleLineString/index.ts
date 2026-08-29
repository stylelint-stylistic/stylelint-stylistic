import { LINE_BREAK } from "../../regexps.ts"

/**
 * Answers whether a text holds no line break, and so stands on one line. A break is what PostCSS reads as one, a line feed with or without the carriage return of a Windows pair in front of it, so a construct broken with one is multi-line to every `*-single-line` and `*-multi-line` option alike, and one holding a bare carriage return or a form feed is single-line to all of them.
 * @param input - The text to measure.
 * @returns True where the text holds no line break, false where it holds one.
 */
export function isSingleLineString (input: string): boolean {
	return !LINE_BREAK.test(input)
}
