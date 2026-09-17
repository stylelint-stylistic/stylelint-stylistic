import { LINE_BREAK, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { EscapeSpan } from "../findCommentSpans/index.ts"

/** The letter every character of an escape is written as. */
const MASK = `x`

/**
 * Writes every escape of a text as `x`, so `style-search` finds no delimiter in one: it reads `a\,b`, one identifier to the grammar, as a list of two, and a rule then writes whitespace beside the backslash (1789649818). The copy is as long as the text.
 *
 * A letter stands in rather than the `?` of {@link maskStrings}: an escape spells a character of a name, `findFunctionArgumentSpans` reads the run in front of a `(` over the copy, and `style-search` opens a call's arguments only behind an ASCII letter, so `fo\6f(` names a call where `fo???(` and `fo____(` name none; a run of one letter spells no word a lookup over the copy asks for. The whitespace closing a hexadecimal escape is written over with it, being a character of the escape to the grammar, so `2\65 f(` stays the dimension `2ef` in front of a parenthesis. A line break closing one stays a break: `max-empty-lines` and `indentation` count the file's lines over the copy, and PostCSS counts a line there, so `2\65` and a break open a call on the line below, as they do to PostCSS's tokenizer, which closes the word at the digits. A rule finds its delimiters over the copy and reads the runs beside them over the source, so the space of `a\2c ,b` is still the run in front of the comma to it.
 * @param text - The text the search runs over.
 * @param spans - The escape spans {@link findEscapeSpans} found in it, in source order.
 * @returns The copy.
 */
export function maskEscapes (text: string, spans: EscapeSpan[]): string {
	if (spans.length === 0) return text

	let pieces = []
	let index = 0

	for (let { start, end } of spans) {
		let span = text.slice(start, end)
		// An escape of two characters spells the second, a space included; a longer one is hexadecimal, and ends in its digits or in the one whitespace character closing them
		let terminator = span.length > 2 ? (span.match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0] : ``
		let kept = LINE_BREAK.test(terminator) ? terminator : ``

		pieces.push(text.slice(index, start), MASK.repeat(span.length - kept.length), kept)
		index = end
	}

	pieces.push(text.slice(index))

	return pieces.join(``)
}
