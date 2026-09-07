import { EVERY_ESCAPE_STRING_OR_COMMENT } from "../../regexps.ts"

/**
 * Blanks every quoted run and every comment of a text, keeping its length, so neither is read as the code around it.
 *
 * A comment goes with its delimiters, since two side by side spell a `//`: `/*one*\//*two*\/` is two block comments. A `//` is read before a `/*`, so `a//*x*\/b` is a `//` comment whatever its text. An escape is read before a quotation mark, so a quote escaped outside a string, as in the Less class `.x\\'y`, opens nothing. The `s` flag lets a backslash escape a line break inside a string.
 * @param text - The text to blank.
 * @returns The text with each quoted run and each comment replaced by spaces.
 */
export function withoutQuotedTextAndComments (text: string): string {
	return text.replaceAll(EVERY_ESCAPE_STRING_OR_COMMENT, (match) => {
		if (match.startsWith(`\\`) || match === `//`) return match

		if (match.startsWith(`/*`)) return ` `.repeat(match.length)

		return match[0] + ` `.repeat(match.length - 2) + match[0]
	})
}
