import { IDENTIFIER_CODE_POINT, INLINE_COMMENT_BREAK, INLINE_COMMENT_BREAK_OR_FORM_FEED } from "../../regexps.ts"
import { namesAnAddress } from "../../utils/namesAnAddress/index.ts"
import { readAddress } from "../../utils/readAddress/index.ts"
import { readEscapedCharacter } from "../../utils/readEscapedCharacter/index.ts"
import type { InlineCommentReading } from "../readsInlineComments/index.ts"

/** Where a scan stands; every state returning to code resets `wordStart`. */
export type Scan = {
	state: `blockComment` | `code` | `inlineComment` | `string`,
	index: number,
	openingQuote: string,
	wordStart: number,
}

/**
 * Reads one character of a `//` comment.
 * @param text - The raw scanned, standing inside a `//` comment.
 * @param scan - The scan, moved on.
 * @param reading - The syntax's reading, which says whether a form feed closes the comment.
 */
function readInsideInlineComment (text: string, scan: Scan, reading: InlineCommentReading): void {
	let char = text.charAt(scan.index)

	if ((reading.endsOnFormFeed ? INLINE_COMMENT_BREAK_OR_FORM_FEED : INLINE_COMMENT_BREAK).test(char)) {
		scan.state = `code`
		scan.wordStart = scan.index + 1
	}
}

/**
 * Reads one character of a block comment.
 * @param text - The raw scanned, standing inside a block comment.
 * @param scan - The scan, moved on.
 */
function readInsideBlockComment (text: string, scan: Scan): void {
	if (text[scan.index] === `*` && text[scan.index + 1] === `/`) {
		scan.state = `code`
		scan.index += 1
		scan.wordStart = scan.index + 1
	}
}

/**
 * Reads one character of a quoted string.
 * @param text - The raw scanned, standing inside a string.
 * @param scan - The scan, moved on.
 */
function readInsideString (text: string, scan: Scan): void {
	let char = text[scan.index]

	if (char === `\\`) scan.index += 1
	else if (char === scan.openingQuote) {
		scan.state = `code`
		scan.wordStart = scan.index + 1
	}
}

/**
 * Reads one character of the code, where every other state opens.
 *
 * A `(` opens an address where {@link namesAnAddress} says so of the name just read: {@link IDENTIFIER_CODE_POINT} code points, an interpolation's closing brace and escapes, since an ASCII pattern took `éurl(` for `url(` ([#398](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/398)). Read forward, since an escape spells one character with several.
 * @param text - The raw scanned, standing in code.
 * @param scan - The scan, moved on.
 * @param reading - The syntax's reading, which says what the parentheses of an address hold.
 */
function readInsideCode (text: string, scan: Scan, reading: InlineCommentReading): void {
	let char = text.charAt(scan.index)
	let nextChar = text[scan.index + 1]

	if (char === `\\`) {
		// The whole escape is one character; a backslash spelling nothing leaves its break to the next step
		let escaped = readEscapedCharacter(text, scan.index, reading)

		scan.index = escaped.end - 1
	}
	else if (char === `"` || char === `'`) {
		scan.state = `string`
		scan.openingQuote = char
	}
	else if (char === `/` && nextChar === `*`) {
		scan.state = `blockComment`
		scan.index += 1
	}
	else if (char === `/` && nextChar === `/`) {
		scan.state = `inlineComment`
		scan.index += 1
	}
	// A bare address carries a protocol's `//` and is stepped over whole; a quoted one leaves its marks to the string state and what stands behind it to this one
	else if (char === `(` && namesAnAddress(text.slice(scan.wordStart, scan.index))) {
		let address = readAddress(text, scan.index + 1, text.slice(scan.wordStart, scan.index), reading)
		let last = address.comments.at(-1)

		if (!address.isQuoted) scan.index = address.index

		// A comment the parentheses hold that runs to the text's end is where the scan ends
		if (!address.isQuoted && last?.end === text.length) scan.state = last.isInline ? `inlineComment` : `blockComment`

		scan.wordStart = scan.index + 1
	}
	else if (!(char === `}` || IDENTIFIER_CODE_POINT.test(char))) {
		scan.wordStart = scan.index + 1
	}
}

/** The reader of one character, by state. */
const READ_INSIDE = {
	blockComment: readInsideBlockComment,
	code: readInsideCode,
	inlineComment: readInsideInlineComment,
	string: readInsideString,
}

/** The default reading: a syntax that spells such a comment. */
const NOTHING_SAID = { spells: true, keeps: false, answered: false, tokenizes: false, endsOnFormFeed: false }

/**
 * Scans a text to its end.
 * @param text - The text, trailing whitespace off.
 * @param reading - The syntax's reading.
 * @returns True if the scan ends inside a `//` comment.
 */
function scanEndsInsideInlineComment (text: string, reading: InlineCommentReading): boolean {
	let scan: Scan = { state: `code`, index: 0, openingQuote: ``, wordStart: 0 }

	while (scan.index < text.length) {
		READ_INSIDE[scan.state](text, scan, reading)

		scan.index += 1
	}

	return scan.state === `inlineComment`
}

/**
 * Asks whether a raw ends inside a `//` comment, where a fixer writing behind it would write.
 *
 * Scanned rather than matched: the `//` in `url(http://example.com)` or `"//"` opens nothing, and `url` is {@link namesAnAddress}'s reading ([#427](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/427)). A syntax spelling no such comment ends `1px//c` in code; the caller says which. {@link INLINE_COMMENT_BREAK} closes the comment, a bare carriage return included, and {@link INLINE_COMMENT_BREAK_OR_FORM_FEED} where the reading says a form feed closes one too.
 * @param source - A raw or a part of one.
 * @param reading - The syntax's reading of such a comment; defaults to spelling it.
 * @returns True if it ends inside a `//` comment.
 */
export function endsWithInlineComment (source: string, reading: InlineCommentReading = NOTHING_SAID): boolean {
	if (!reading.spells) return false

	// The trailing whitespace is where a fixer writes, so it closes nothing
	let text = source.trimEnd()

	return scanEndsInsideInlineComment(text, reading)
}
