import { IDENTIFIER_CODE_POINT, LINE_BREAK, OPENS_NO_IDENTIFIER } from "../../regexps.ts"
import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"

/**
 * Skips a quoted string.
 * @param text - The value the string stands in.
 * @param openIndex - The opening quote.
 * @returns The index behind the closing quote, or the end of the text.
 */
function skipString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return index + 1
}

/**
 * Skips a string, a block comment or a `//` comment standing at an index.
 * @param text - The value scanned.
 * @param index - Where the candidate opens.
 * @returns The index behind it, or null where code stands there.
 */
function skipNonCode (text: string, index: number): number | null {
	let character = text.charAt(index)
	let next = text[index + 1]

	if (character === `"` || character === `'`) return skipString(text, index)

	if (character === `/` && next === `*`) {
		let closeIndex = text.indexOf(`*/`, index + 2)

		return closeIndex === -1 ? text.length : closeIndex + 2
	}

	if (character === `/` && next === `/`) {
		let breakIndex = text.slice(index).search(LINE_BREAK)

		return breakIndex === -1 ? text.length : index + breakIndex
	}

	return null
}

/**
 * The length of the escape at an index, backslash included. {@link readIdentifierCharacter} reads both spellings; a backslash in front of a line break or at the end escapes nothing.
 * @param text - The value holding the backslash.
 * @param index - The backslash.
 * @returns The characters the escape occupies, or zero.
 */
function escapeLength (text: string, index: number): number {
	let { character, end } = readIdentifierCharacter(text, index)

	return character === undefined ? 0 : end - index
}

/**
 * The name of the call opened at an index, or the empty string where none stands in front of it.
 *
 * The name is read forwards during the scan rather than back from the `(`, since the run in front of `fo\6f(` reads `6f`. A run opening on a digit, a hyphen and a digit, or a hyphen alone is a number or an operator, not a name: reading `-(` as a call corrupts `h1 { width: -(@a * 2)px; }`. An escape opens an identifier anywhere. Less names a call by `%`, so a `%` in front of the `(` names one unless a run closes right in front of it, as in `50%(1)`. The name is lower-cased but no escape is resolved, so a lookup finds `\75 rl` where the file means `url`; only the media utilities look one up.
 * @param text - The value the `(` stands in.
 * @param runStart - Where the run in front of the `(` opens, or null where none does.
 * @param runEnd - Where the last run closed, or minus one.
 * @param index - The opening `(`.
 * @returns The name, or the empty string.
 */
function readName (text: string, runStart: number | null, runEnd: number, index: number): string {
	if (runStart === null) return text[index - 1] === `%` && runEnd !== index - 1 ? `%` : ``

	let run = text.slice(runStart, index)

	return OPENS_NO_IDENTIFIER.test(run) ? `` : run.toLowerCase()
}

/** The arguments of one call, from behind its `(` to its `)`, with the call's name. */
export type FunctionArgumentSpan = {
	start: number,
	end: number,
	name: string,
}

/**
 * Finds the argument spans of the function calls in a text.
 *
 * A `(` opens a call only behind an identifier as {@link readName} reads one, so `(min-width: 1px)`, `screen and (color)` and `#{$a}(1,2)` open none. Spans nest. A call left open reaches the end of the text. A `(` inside a string or a comment, or escaped, opens nothing. The name comes with the span because a caller may know a word that names no function: `and(min-width: 1px)` is a media feature missing its space.
 * @param text - The value or params to scan.
 * @returns The spans, in the text's coordinates.
 */
export function findFunctionArgumentSpans (text: string): FunctionArgumentSpan[] {
	let spans: FunctionArgumentSpan[] = []

	let openings: ({
		start: number,
		name: string,
	} | null)[] = []
	let index = 0

	let runStart: number | null = null

	// A run closing right in front of a `%` makes it a percentage, not Less's call operator
	let runEnd = -1

	while (index < text.length) {
		let character = text.charAt(index)
		let skipped = skipNonCode(text, index)
		let escape = character === `\\` ? escapeLength(text, index) : 0

		if (skipped !== null) {
			if (runStart !== null) runEnd = index

			index = skipped
			runStart = null
		}
		else if (escape > 0) {
			if (runStart === null) runStart = index

			index += escape
		}
		else if (character === `(`) {
			let name = readName(text, runStart, runEnd, index)

			openings.push(name === `` ? null : { start: index + 1, name })
			if (runStart !== null) runEnd = index
			runStart = null
			index += 1
		}
		else if (character === `)`) {
			let opening = openings.pop()

			if (opening) spans.push({ start: opening.start, end: index, name: opening.name })

			if (runStart !== null) runEnd = index
			runStart = null
			index += 1
		}
		else if (IDENTIFIER_CODE_POINT.test(character)) {
			if (runStart === null) runStart = index

			index += 1
		}
		else {
			if (runStart !== null) runEnd = index

			runStart = null
			index += 1
		}
	}

	// An unclosed call holds everything behind it
	for (let opening of openings) {
		if (opening) spans.push({ start: opening.start, end: text.length, name: opening.name })
	}

	return spans
}
