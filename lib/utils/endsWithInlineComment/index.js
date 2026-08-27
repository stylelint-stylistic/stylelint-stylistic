import { CR_OR_LF, LINE_BREAK, OPENS_WITH_QUOTE, URL_CALL_AT_END } from "../../regexps.js"
import { formFeedReadingsOwed } from "../readsInlineComments/index.js"

/**
 * Where a scan stands: what it is reading, how far it has read, the quote that would close the string it is inside, and the pattern that closes the comment it may be inside.
 * @typedef {{ state: string, index: number, openingQuote: string, closesInlineComment: RegExp }} Scan
 */

/**
 * Reads one character of an inline comment.
 * @param {string} text - The text being scanned.
 * @param {Scan} scan - Where the scan stands, moved on by what is read.
 */
function readInsideInlineComment (text, scan) {
	let char = text[scan.index]

	// Which characters are breaks is the one thing the two languages disagree about, and the reading the scan was opened under is which of the two it is being asked as
	if (scan.closesInlineComment.test(char)) scan.state = `code`
}

/**
 * Reads one character of a block comment.
 * @param {string} text - The text being scanned.
 * @param {Scan} scan - Where the scan stands, moved on by what is read.
 */
function readInsideBlockComment (text, scan) {
	if (text[scan.index] === `*` && text[scan.index + 1] === `/`) {
		scan.state = `code`
		scan.index += 1
	}
}

/**
 * Reads one character of a quoted string.
 * @param {string} text - The text being scanned.
 * @param {Scan} scan - Where the scan stands, moved on by what is read.
 */
function readInsideString (text, scan) {
	let char = text[scan.index]

	if (char === `\\`) scan.index += 1
	else if (char === scan.openingQuote) scan.state = `code`
}

/**
 * Reads one character of an unquoted `url()`.
 * @param {string} text - The text being scanned.
 * @param {Scan} scan - Where the scan stands, moved on by what is read.
 */
function readInsideUrl (text, scan) {
	let char = text[scan.index]

	if (char === `\\`) scan.index += 1
	else if (char === `)`) scan.state = `code`
}

/**
 * Reads one character of the code itself, which is where every other state is opened from.
 * @param {string} text - The text being scanned.
 * @param {Scan} scan - Where the scan stands, moved on by what is read.
 */
function readInsideCode (text, scan) {
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

/** The reading a caller naming none is answered under: a syntax that spells such a comment and has said nothing about the form feed, which is every reading at once. */
const NOTHING_SAID = { spells: true, keeps: false, endsOnFormFeed: undefined }

/**
 * Scans a text under one reading of a line break.
 * @param {string} text - The text to scan, its trailing whitespace already off it.
 * @param {boolean} endsOnFormFeed - Whether a form feed closes an inline comment in the language the text is written in.
 * @returns {boolean} True if the scan ends inside an inline comment.
 */
function scanEndsInsideInlineComment (text, endsOnFormFeed) {
	/** @type {Scan} */
	let scan = { state: `code`, index: 0, openingQuote: ``, closesInlineComment: endsOnFormFeed ? LINE_BREAK : CR_OR_LF }

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
 * Which characters are breaks is the caller's to say as well, and for the same reason: Sass ends such a comment on a form feed and Less does not, so the text alone cannot tell where one stops. Both come over in the reading {@link inlineCommentReading} gives for a node. The older shape read a line feed and a carriage return and nothing else, which is Less's reading entire — so every file was read as a Less file, whatever language it was written in.
 *
 * Where the reading leaves the language unnamed it is owed both answers, and a comment holding the end of the text under either of them is one this answers about. Neither may be trusted alone there: the two are not ordered by how much they let through, an early close handing the characters behind it to the code, and code opening a string or a comment the other reading never saw.
 * @param {string} source - The raw string to look at, a `raws` value or a part of one.
 * @param {import('../readsInlineComments/index.js').InlineCommentReading} [reading] - What the syntax that spelled the string makes of such a comment, defaulted to a syntax that has said nothing.
 * @returns {boolean} True if the string ends with an inline comment.
 */
export function endsWithInlineComment (source, reading = NOTHING_SAID) {
	// Where no double slash opens a comment, no text ends with one, and the scan below has nothing else it could answer with
	if (!reading.spells) return false

	// Whatever a fixer writes goes where the trailing whitespace is, the line break closing the comment among it, so none of that whitespace counts as closing anything here
	let text = source.trimEnd()

	return formFeedReadingsOwed(reading).some((endsOnFormFeed) => scanEndsInsideInlineComment(text, endsOnFormFeed))
}
