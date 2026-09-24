import { EVERY_LINE_BREAK, EVERY_LINE_BREAK_AND_INDENT, LEADING_CSS_WHITESPACE, WHITESPACE_WITHOUT_BREAK_BEFORE_CONTENT } from "../../regexps.ts"
import type { InterpolationSpan } from "../findInterpolationSpans/index.ts"

/**
 * Finds where a text's lines open behind a break: behind every break standing outside the spans, since a break inside a styled template's interpolation ends a line of JavaScript and none of the stylesheet's.
 * @param text - The text.
 * @param spans - The spans of host code in the text.
 * @returns The index behind each such break, in order.
 */
export function lineStarts (text: string, spans: InterpolationSpan[] = []): number[] {
	let starts = []

	for (let { 0: lineBreak, index } of text.matchAll(EVERY_LINE_BREAK)) {
		if (!spans.some((span) => span.start <= index && index < span.end)) starts.push(index + lineBreak.length)
	}

	return starts
}

/**
 * Finds where a text's last line opens, as {@link lineStarts} reads the breaks.
 * @param text - The text.
 * @param spans - The spans of host code in the text.
 * @returns The index behind the last break, or `-1` where the text holds none.
 */
export function lastLineStart (text: string, spans: InterpolationSpan[] = []): number {
	return lineStarts(text, spans).at(-1) ?? -1
}

/**
 * Writes the indentation behind every break of a text that content or the text's end follows; a line another break closes keeps its run, and a break inside a span of host code is no line of the stylesheet.
 * @param str - The text.
 * @param whitespace - The indentation.
 * @param spans - The spans of host code in the text.
 * @returns The text.
 */
export function fixIndentation (str: string, whitespace: string, spans: InterpolationSpan[] = []): string {
	return str.replaceAll(EVERY_LINE_BREAK_AND_INDENT, (line: string, lineBreak: string, index: number) => spans.some((span) => span.start <= index && index < span.end) ? line : `${lineBreak}${whitespace}`)
}

/**
 * Reads the indentation of a text's last line.
 * @param text - The text.
 * @param spans - The spans of host code in the text.
 * @returns The tokenizer whitespace opening the last line.
 */
export function lastLineIndentation (text: string, spans: InterpolationSpan[] = []): string {
	return text.slice(Math.max(lastLineStart(text, spans), 0)).match(LEADING_CSS_WHITESPACE)?.[0] ?? ``
}

/**
 * Writes a node's indentation into its `raws.before`: the run behind every break outside host code and, for a root's first node, the run opening the raw, unless host code opens right behind it on a line in front of the node's.
 * @param before - The raw.
 * @param indentation - The indentation asked for.
 * @param spans - The spans of host code in the raw.
 * @param writesHead - Whether the node is its root's first.
 * @returns The raw.
 */
export function writeIndentationBefore (before: string, indentation: string, spans: InterpolationSpan[], writesHead: boolean): string {
	let written = fixIndentation(before, indentation, spans)
	let head = before.match(WHITESPACE_WITHOUT_BREAK_BEFORE_CONTENT)?.[0]

	// Behind a break an interpolation opening the raw stands on the line of the backtick, which a fix of the node's own line has no business writing
	if (!writesHead || head === undefined || (lastLineStart(before, spans) >= 0 && spans.some((span) => span.start === head.length))) return written

	return written.replace(WHITESPACE_WITHOUT_BREAK_BEFORE_CONTENT, indentation)
}

/**
 * Replaces the indentation behind one break.
 * @param input - The text.
 * @param searchString - The indentation there.
 * @param replaceString - The replacement.
 * @param startIndex - The break's index; `-1` for a line the text opens with.
 * @returns The text.
 */
export function replaceIndentation (input: string, searchString: string, replaceString: string, startIndex: number): string {
	let offset = startIndex + 1
	let stringStart = input.slice(0, offset)
	let stringEnd = input.slice(offset + searchString.length)

	return stringStart + replaceString + stringEnd
}
