import { LINE_BREAK, TRAILING_CSS_WHITESPACE, TRAILING_HEX_ESCAPE } from "../../regexps.ts"
import type { EscapeSpan } from "../findCommentSpans/index.ts"

/** The letter every character of an escape is written as. */
const MASK = `x`

/**
 * Writes every escape of a text as `x`, so `style-search` finds no delimiter in one: it reads `a\,b`, one identifier to the grammar, as a list of two, and a rule then writes whitespace beside the backslash. The copy is as long as the text.
 *
 * A letter stands in rather than the `?` of {@link maskStrings}: an escape spells a character of a name, `findFunctionArgumentSpans` reads the run in front of a `(` over the copy, and `style-search` opens a call's arguments only behind an ASCII letter, so `fo\6f(` names a call where `fo???(` and `fo____(` name none; a run of one letter spells no word a lookup over the copy asks for. The whitespace closing a hexadecimal escape is written over with it, being a character of the escape to the grammar, so `2\65 f(` stays the dimension `2ef` in front of a parenthesis. A line break closing one stays a break: `max-empty-lines` and `indentation` count the file's lines over the copy, and PostCSS counts a line there, so `2\65` and a break open a call on the line below, as they do to PostCSS's tokenizer, which closes the word at the digits.
 *
 * In the copy the runs beside a delimiter are read over, the second copy of `searchCopy`, that whitespace stays as it is: no delimiter is a hexadecimal digit, so a run written or taken away in front of one leaves the escape closed where it was, `a\2c ,b` and `a\2c,b` spelling the same tokens to Less, Sass and lightningcss, whereas a space written straight behind the digits and then read as the escape's own would be asked for again on the next run.
 * @param text - The text the search runs over.
 * @param spans - The escape spans {@link findEscapeSpans} found in it, in source order.
 * @param terminatorStays - Whether the whitespace closing a hexadecimal escape is left as it is.
 * @returns The copy.
 */
export function maskEscapes (text: string, spans: EscapeSpan[], terminatorStays: boolean = false): string {
	if (spans.length === 0) return text

	let pieces = []
	let index = 0

	for (let { start, end } of spans) {
		let span = text.slice(start, end)
		// An escape of two characters spells the second, a space included; a longer one is hexadecimal, and ends in its digits or in the one whitespace character closing them
		let terminator = span.length > 2 ? (span.match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0] : ``
		let kept = terminatorStays || LINE_BREAK.test(terminator) ? terminator : ``

		pieces.push(text.slice(index, start), MASK.repeat(span.length - kept.length), kept)
		index = end
	}

	pieces.push(text.slice(index))

	return pieces.join(``)
}

/**
 * The length of the head of a raw that an escape in front of it spells.
 *
 * Where an escape covers whitespace the tokenizer reads as such, PostCSS ends the word at the backslash and files that character in the raw behind it: `c\ ` is the value `c\` and a `raws.after` opening on the space the escape spells, and `c\⇥` the same with a tab. A rule reading its run over the copy of {@link maskEscapes} must keep that head where it writes the raw back, the character being the last of the word and no run at all. An escape covering anything else stays in the word whole, and the head is empty.
 *
 * The whitespace closing a hexadecimal escape is part of the head, being a character of the escape to the grammar, as it is masked in the copy the run is read over: `a\2c {` holds no run in front of the brace, and a rule asking one writes its own behind the escape. A line break closing one is a run all the same, as it stays a break in the copy: PostCSS files it in the raw, and the rules write over it.
 * @param text - The text the raw stands in.
 * @param spans - The escape spans {@link findEscapeSpans} found in it, in source order.
 * @param index - Where the raw opens in it.
 * @returns The number of characters the escape owns there, zero where none does.
 */
export function escapeHeadLength (text: string, spans: EscapeSpan[], index: number): number {
	let span = spans.find(({ start, end }) => start < index && end > index)

	if (!span) return 0

	let escape = text.slice(span.start, span.end)
	// An escape of two characters spells the second; a longer one is hexadecimal and may close on one whitespace character, which is a character of the escape but for a line break
	let terminator = escape.length > 2 ? (escape.match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0] : ``
	let kept = LINE_BREAK.test(terminator) ? terminator.length : 0

	return Math.max(0, span.end - kept - index)
}

/**
 * Asks whether a space written at an index closes a hexadecimal escape standing right in front of it: the escape's digits end there, whether the escape is closed by nothing or by the break the write goes over, and the space is read as the escape's own rather than as a run, so a rule writing one there writes the escape's closing space first, or the run it asked for is asked for again on the next pass. A break written there is a run all the same, as {@link escapeHeadLength} reads it.
 * @param text - The text the raw stands in.
 * @param spans - The escape spans {@link findEscapeSpans} found in it, in source order.
 * @param index - Where the raw opens in it.
 * @returns True where a space written there closes the escape.
 */
export function escapeClosesOnWrittenSpace (text: string, spans: EscapeSpan[], index: number): boolean {
	return spans.some(({ start, end }) => start < index && end >= index && TRAILING_HEX_ESCAPE.test(text.slice(start, index)))
}

/**
 * Measures the whitespace closing a hexadecimal escape at the head of a raw, a break aside, which a line break written behind the head makes redundant: the break closes the escape as well, and the whitespace in front of it would trail its line. An escaped space at the head is a character and no terminator.
 * @param text - The text the raw stands in.
 * @param spans - The escape spans {@link findEscapeSpans} found in it, in source order.
 * @param index - Where the raw opens in it.
 * @returns The terminator's length inside the head, zero where the head holds none.
 */
export function hexadecimalTerminatorAtHead (text: string, spans: EscapeSpan[], index: number): number {
	let span = spans.find(({ start, end }) => start < index && end > index)

	if (!span) return 0

	let escape = text.slice(span.start, span.end)
	let terminator = escape.length > 2 ? (escape.match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0] : ``

	return terminator && !LINE_BREAK.test(terminator) && span.end - terminator.length <= index ? span.end - index : 0
}
