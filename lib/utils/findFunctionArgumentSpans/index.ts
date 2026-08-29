import { IDENTIFIER_CODE_POINT, LINE_BREAK, OPENS_NO_IDENTIFIER } from "../../regexps.ts"
import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"

/**
 * Skips a quoted string, from its opening quote to the character behind its closing one.
 * @param text - The text being scanned.
 * @param openIndex - The index of the opening quote.
 * @returns The index behind the closing quote, or the end of the scanned text.
 */
function skipString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return index + 1
}

/**
 * Skips whatever a text spells at an index that is not code: a quoted string, a block comment, an inline comment.
 * @param text - The text being scanned.
 * @param index - The index to read from.
 * @returns The index behind what was skipped, or null where code stands there.
 */
function skipNonCode (text: string, index: number): number | null {
	let character = text[index]
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
 * The length of the escape a text carries at an index, backslash included, and zero where the backslash escapes nothing.
 *
 * An escape spells one character of an identifier with several, and {@link readIdentifierCharacter} reads both spellings CSS gives it, handing back the character along with the index behind it. So `\66 oo` is `foo` and `\)` is a parenthesis that closes nothing. A backslash escapes nothing where a line break stands behind it or where the text ends there — it is a delimiter of its own then, and no character of any name, which is the empty character that reading answers with.
 * @param text - The text being scanned.
 * @param index - The index of the backslash.
 * @returns The number of characters the escape occupies, or zero where the backslash opens none.
 */
function escapeLength (text: string, index: number): number {
	let { character, end } = readIdentifierCharacter(text, index)

	return character === undefined ? 0 : end - index
}

/**
 * The name a call standing at an index was opened by, and the empty string where nothing nameable stands in front of it.
 *
 * A name is a run of identifier code points and escapes, read forwards while the text is scanned rather than back from the parenthesis, since a backslash cannot be told from the character it escapes by looking behind it: the run in front of the parenthesis of `fo\6f(` reads `6f` and opens on a digit, while the identifier it spells is `foo` and opens on a letter.
 *
 * A run is a name unless it opens on a digit, or on a hyphen and a digit, or is a hyphen alone: `2px(`, `-2a(`, `-(` and `2-(` are a number or an operator in front of a parenthesis rather than a call, and reading one of them as a call is what corrupts `h1 { width: -(@a * 2)px; }`. An escape opens an identifier wherever it stands, so `\31 23(` is a call however the digits read.
 *
 * Less names one call by an operator rather than by an identifier, `%("%dpx", @a)` formatting a string, so a `%` in front of the parenthesis names that call and no other character does. It names one only where no run of name characters closes on the character in front of the `%` itself: the `%` of `50%(1)` and of `\31 %(1)` closes a percentage, which CSS reads as a number in front of a parenthesis and no call at all.
 *
 * The name is handed back in lower case and otherwise as the file spells it: an escape is not resolved, so a caller looking a name up finds `\75 rl` where the file means `url`. Nothing looks one up but the three media utilities, and they ask after `and`, `or`, `not` and `only`, which no file spells that way.
 * @param text - The text being scanned.
 * @param runStart - The index the run of identifier code points in front of the parenthesis opens at, or null where the character in front of it is no such code point.
 * @param runEnd - The index the last run of the text closed at, or minus one where it has held none.
 * @param index - The index of the opening parenthesis.
 * @returns The name, or the empty string where the run is no identifier and no operator names the call.
 */
function readName (text: string, runStart: number | null, runEnd: number, index: number): string {
	if (runStart === null) return text[index - 1] === `%` && runEnd !== index - 1 ? `%` : ``

	let run = text.slice(runStart, index)

	return OPENS_NO_IDENTIFIER.test(run) ? `` : run.toLowerCase()
}

/** The span the arguments of one function call occupy in a text, from the character behind its opening parenthesis to its closing one, under the name the call was made by. */
type FunctionArgumentSpan = { start: number, end: number, name: string }

/**
 * Finds the spans the arguments of the function calls of a text occupy in it.
 *
 * A parenthesis opens a call only where an identifier stands in front of it: `url(` and `translate(` open one, while the parentheses of `(min-width: 1px)` and of `screen and (color)` group a media feature and open nothing. `style-search` answers the same question of itself, and answers it wrongly for a text that opens on a parenthesis — it reads the character in front of the first one out of nothing at all and finds a letter there — which is exactly the shape a set of media parameters usually has. What counts as an identifier is {@link readName}'s to say; an interpolation spells none, so `#{$a}(1,2)` and `@{v}(1,2)` name nothing that can be looked up, and `#{$q}(min-width: 1px)` is a media feature behind an interpolated query.
 *
 * A call standing inside a call gets a span of its own, so the spans may lie inside one another; every one of them covers its own arguments and nothing else. A call left open reaches the end of the text, since the text behind it is the arguments as far as anything can tell. A parenthesis that stands inside a string or a comment opens and closes nothing, and neither does one that is escaped, so the address of `url(a\)b)` keeps the parenthesis it spells.
 *
 * The name a call was made by comes with its span, since a caller may know a word that names no function however a file spells it: `and(min-width: 1px)` is a media feature written without the space the grammar asks for, and the rules that read a media query list say so.
 * @param text - The text to scan.
 * @returns The spans, in the coordinates of the scanned text.
 */
export function findFunctionArgumentSpans (text: string): FunctionArgumentSpan[] {
	let spans: FunctionArgumentSpan[] = []

	let openings: ({ start: number, name: string } | null)[] = []
	let index = 0

	let runStart: number | null = null

	// The index the last run closed at, which the operator Less names a call by is told from a percentage by: a run closing on the character in front of a `%` makes that `%` the end of a number rather than a name of its own
	let runEnd = -1

	while (index < text.length) {
		let character = text[index]
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

	// A call the text never closes holds everything behind it
	for (let opening of openings) {
		if (opening) spans.push({ start: opening.start, end: text.length, name: opening.name })
	}

	return spans
}

export type { FunctionArgumentSpan }
