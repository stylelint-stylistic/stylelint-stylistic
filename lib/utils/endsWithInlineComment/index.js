import { OPENS_WITH_QUOTE, URL_CALL_AT_END } from "../../regexps.js"

/**
 * Where a scan stands: what it is reading, how far it has read, and the quote that would close the string it is inside.
 * @typedef {{ state: string, index: number, openingQuote: string }} Scan
 */

/**
 * Reads one character of an inline comment.
 * @param {string} text - The text being scanned.
 * @param {Scan} scan - Where the scan stands, moved on by what is read.
 */
function readInsideInlineComment (text, scan) {
	let char = text[scan.index]

	// A line feed is not the only break that closes a comment: a carriage return closes one as well, in Sass by its own reading of a line and in Less by the line endings it normalises before parsing. A form feed is left out, though Sass ends a comment on it too, because Less does not: taking a comment for one still open only ever holds a fix back, while taking one for closed where it is not lets a fix write into its text.
	if (char === `\n` || char === `\r`) scan.state = `code`
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

/**
 * Checks whether the last thing a raw string holds is an inline comment.
 *
 * An inline comment is closed by a line break and by nothing else — by a line feed or by a carriage return, the breaks every syntax reads as one — so whatever a fixer would put after it, a space, a brace, a colon, a semicolon, ends up inside the comment instead. Trailing whitespace does not close it either, and is therefore ignored here.
 *
 * A double slash only opens a comment where it stands in the code itself: the one in `url(http://example.com)` or in `content: "//"` opens nothing, and a string reaching that far is scanned rather than matched, so that neither is taken for a comment.
 *
 * Nor does one open a comment where the syntax spells none that way, and a file of plain CSS spells none: `1px//c` ends in code there, and a fixer told otherwise holds back a write that would break nothing. The text cannot answer that, since the two spellings are identical, so the caller does — the answer being the one {@link readsInlineComments} gives for a node. It is defaulted to the syntaxes that do spell such a comment, which is the answer that only ever holds a fix back.
 * @param {string} source - The raw string to look at, a `raws` value or a part of one.
 * @param {boolean} [spellsInlineComments] - False where the syntax that spelled the string writes no comment with a double slash.
 * @returns {boolean} True if the string ends with an inline comment.
 */
export function endsWithInlineComment (source, spellsInlineComments = true) {
	// Where no double slash opens a comment, no text ends with one, and the scan below has nothing else it could answer with
	if (!spellsInlineComments) return false

	// Whatever a fixer writes goes where the trailing whitespace is, the line break closing the comment among it, so none of that whitespace counts as closing anything here
	let text = source.trimEnd()

	/** @type {Scan} */
	let scan = { state: `code`, index: 0, openingQuote: `` }

	while (scan.index < text.length) {
		READ_INSIDE[scan.state](text, scan)

		scan.index += 1
	}

	return scan.state === `inlineComment`
}
