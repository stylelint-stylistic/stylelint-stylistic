import { LINE_BREAK, OPENS_WITH_QUOTE, URL_CALL_AT_END } from "../../regexps.ts"
import type { InlineCommentReading } from "../readsInlineComments/index.ts"

/** Where a scan stands: what it is reading, how far it has read, the quote that would close the string it is inside, and the pattern that closes the comment it may be inside. */
export type Scan = {
	state: `blockComment` | `code` | `inlineComment` | `string` | `url`,
	index: number,
	openingQuote: string,
}

/**
 * Reads one character of an inline comment.
 * @param text - The text being scanned.
 * @param scan - Where the scan stands, moved on by what is read.
 */
function readInsideInlineComment (text: string, scan: Scan): void {
	let char = text.charAt(scan.index)

	// Which characters are breaks is the one thing the two languages disagree about, and the reading the scan was opened under is which of the two it is being asked as
	if (LINE_BREAK.test(char)) scan.state = `code`
}

/**
 * Reads one character of a block comment.
 * @param text - The text being scanned.
 * @param scan - Where the scan stands, moved on by what is read.
 */
function readInsideBlockComment (text: string, scan: Scan): void {
	if (text[scan.index] === `*` && text[scan.index + 1] === `/`) {
		scan.state = `code`
		scan.index += 1
	}
}

/**
 * Reads one character of a quoted string.
 * @param text - The text being scanned.
 * @param scan - Where the scan stands, moved on by what is read.
 */
function readInsideString (text: string, scan: Scan): void {
	let char = text[scan.index]

	if (char === `\\`) scan.index += 1
	else if (char === scan.openingQuote) scan.state = `code`
}

/**
 * Reads one character of an unquoted `url()`.
 * @param text - The text being scanned.
 * @param scan - Where the scan stands, moved on by what is read.
 */
function readInsideUrl (text: string, scan: Scan): void {
	let char = text[scan.index]

	if (char === `\\`) scan.index += 1
	else if (char === `)`) scan.state = `code`
}

/**
 * Reads one character of the code itself, which is where every other state is opened from.
 * @param text - The text being scanned.
 * @param scan - Where the scan stands, moved on by what is read.
 */
function readInsideCode (text: string, scan: Scan): void {
	let char = text[scan.index]
	let nextChar = text[scan.index + 1]

	if (char === `\\`) scan.index += 1
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
	// An unquoted URL carries the double slash of a protocol, and a quoted one is left to the string state
	else if (char === `(` && URL_CALL_AT_END.test(text.slice(0, scan.index + 1)) && !OPENS_WITH_QUOTE.test(text.slice(scan.index + 1))) {
		scan.state = `url`
	}
}

/** How one character is read in each of the states the scan passes through. */
const READ_INSIDE = {
	blockComment: readInsideBlockComment,
	code: readInsideCode,
	inlineComment: readInsideInlineComment,
	string: readInsideString,
	url: readInsideUrl,
}

/** The reading a caller naming none is answered under: a syntax that spells such a comment. */
const NOTHING_SAID = { spells: true, keeps: false }

/**
 * Scans a text for the comment it may end inside.
 * @param text - The text to scan, its trailing whitespace already off it.
 * @returns True if the scan ends inside an inline comment.
 */
function scanEndsInsideInlineComment (text: string): boolean {
	let scan: Scan = { state: `code`, index: 0, openingQuote: `` }

	while (scan.index < text.length) {
		READ_INSIDE[scan.state](text, scan)

		scan.index += 1
	}

	return scan.state === `inlineComment`
}

/**
 * Checks whether the last thing a raw string holds is an inline comment.
 *
 * An inline comment is closed by a line break and by nothing else — so whatever a fixer would put after it, a space, a brace, a colon, a semicolon, ends up inside the comment instead. Trailing whitespace does not close it either, and is therefore ignored here.
 *
 * A double slash only opens a comment where it stands in the code itself: the one in `url(http://example.com)` or in `content: "//"` opens nothing, and a string reaching that far is scanned rather than matched, so that neither is taken for a comment.
 *
 * Nor does one open a comment where the syntax spells none that way, and a file of plain CSS spells none: `1px//c` ends in code there, and a fixer told otherwise holds back a write that would break nothing. The text cannot answer that, since the two spellings are identical, so the caller does.
 *
 * The break that closes one is the break PostCSS reads a line in, a line feed with or without the carriage return of a Windows pair in front of it; a bare carriage return and a form feed are whitespace of the comment's text.
 * @param source - The raw string to look at, a `raws` value or a part of one.
 * @param reading - What the syntax that spelled the string makes of such a comment, defaulted to a syntax that has said nothing.
 * @returns True if the string ends with an inline comment.
 */
export function endsWithInlineComment (source: string, reading: InlineCommentReading = NOTHING_SAID): boolean {
	// Where no double slash opens a comment, no text ends with one, and the scan below has nothing else it could answer with
	if (!reading.spells) return false

	// Whatever a fixer writes goes where the trailing whitespace is, the line break closing the comment among it, so none of that whitespace counts as closing anything here
	let text = source.trimEnd()

	return scanEndsInsideInlineComment(text)
}
