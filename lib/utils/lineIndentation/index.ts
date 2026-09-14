import { EVERY_LINE_BREAK_AND_INDENT, LEADING_CSS_WHITESPACE } from "../../regexps.ts"

/**
 * Writes the indentation behind every break of a text that content or the text's end follows; a line another break closes keeps its run.
 * @param str - The text.
 * @param whitespace - The indentation.
 * @returns The text.
 */
export function fixIndentation (str: string, whitespace: string): string {
	return str.replaceAll(EVERY_LINE_BREAK_AND_INDENT, `$1${whitespace}`)
}

/**
 * Reads the indentation of a text's last line.
 * @param lines - The text, split at its breaks.
 * @returns The tokenizer whitespace opening the last line.
 */
export function lastLineIndentation (lines: string[]): string {
	return lines.at(-1)?.match(LEADING_CSS_WHITESPACE)?.[0] ?? ``
}
