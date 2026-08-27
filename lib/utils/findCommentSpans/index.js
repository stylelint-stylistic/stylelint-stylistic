import { IDENTIFIER_CODE_POINT } from "../../regexps.js"
import { namesAnAddress } from "../namesAnAddress/index.js"
import { readIdentifierCharacter } from "../readIdentifierCharacter/index.js"

/**
 * Finds the break that closes an inline comment opened at the given index.
 * @param {string} text - The string being scanned.
 * @param {number} openIndex - The index the comment opens at.
 * @param {boolean} endsOnFormFeed - True where a form feed closes a comment of this string.
 * @returns {number} The index of the break, or the end of the string where the comment runs to it.
 */
function findLineBreak (text, openIndex, endsOnFormFeed) {
	for (let index = openIndex; index < text.length; index += 1) {
		let character = text[index]

		if (character === `\n` || character === `\r`) return index

		if (endsOnFormFeed && character === `\f`) return index
	}

	return text.length
}

/**
 * Skips the name of a `url()` and the parenthesis it opens on, whose three letters CSS lets a stylesheet spell with an escape wherever it likes.
 *
 * Three characters of an identifier are read off whatever they spell, and what they spelled is put to {@link namesAnAddress}, the one reading of that question the plugin holds. Reading them first and asking afterwards costs a step on a name that is no address and saves the helper from having to find where the name ends, which the caller of a scan knows and the reader of a name does not.
 * @param {string} text - The string being scanned.
 * @param {number} openIndex - The index the name would open at.
 * @returns {number} The index behind the opening parenthesis, or the given one where no `url(` is spelled from there.
 */
function skipUrlName (text, openIndex) {
	let index = openIndex

	for (let step = 0; step < 3; step += 1) index = readIdentifierCharacter(text, index).end

	if (text[index] !== `(`) return openIndex

	return namesAnAddress(text.slice(openIndex, index)) ? index + 1 : openIndex
}

/**
 * Skips a `url()` token, whose address carries its double slashes as ordinary characters whether it is quoted or bare. The name has to stand on its own — `image-url(`, `image-\75 rl(` and `@{prefix}url(` all end in a name spelling `url` while being ordinary calls, whose arguments may hold a comment — and the parentheses are counted rather than searched for, since an interpolated address brings its own. A parenthesis that is escaped, quoted or commented out is none, and a token left open is taken for no token at all, so that a comment standing behind it is still seen.
 *
 * Whether a name stands in front of this one is a question the scan answers as it goes rather than by looking back a character, since an escape spells a character of a name with several and the last of those tells nothing: the `\61 ` opening `\61 \75 rl(` closes on a space and the `\\` opening `\\\75 rl(` on a backslash, while both spell a name and both leave an ordinary call — `aurl(` and `\url(` — which is what `lightningcss` reads there.
 *
 * The loop inside steps two characters at a backslash where the loop outside steps the whole escape, and needs no more: behind those two only hexadecimal digits and the one whitespace closing them can still belong to the escape, and none of those is a parenthesis, a quotation mark or a slash.
 * @param {string} text - The string being scanned.
 * @param {number} openIndex - The index the token would start at.
 * @param {boolean} behindIdentifier - True where the character run in front of the index is one this scan reads as part of a name: a code point {@link IDENTIFIER_CODE_POINT} names, a closing brace, or an escape spelling anything at all. The code points are the ones the grammar names and not the ASCII ones alone, so `éurl(http://x)` and `日本url(http://x)` are the ordinary calls `lightningcss` reads there rather than addresses.
 * @returns {number} The index behind the closing parenthesis, or the given one if no `url()` starts and ends there.
 */
function skipUrl (text, openIndex, behindIdentifier) {
	if (behindIdentifier) return openIndex

	let behindName = skipUrlName(text, openIndex)

	if (behindName === openIndex) return openIndex

	let depth = 1
	let index = behindName

	while (index < text.length && depth > 0) {
		let character = text[index]

		if (character === `\\`) {
			index += 2
		}
		else if (character === `"` || character === `'`) {
			index = skipString(text, index)
		}
		else if (character === `/` && text[index + 1] === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)

			index = closeIndex === -1 ? text.length : closeIndex + 2
		}
		else {
			if (character === `(`) depth += 1
			else if (character === `)`) depth -= 1

			index += 1
		}
	}

	return depth > 0 ? openIndex : index
}

/**
 * Skips a quoted string, from its opening quote to the character behind its closing one. An escaped quotation mark closes nothing, and a string mistaken for closed here would leave the text of the next one exposed to the scan.
 * @param {string} text - The string being scanned.
 * @param {number} openIndex - The index of the opening quote.
 * @returns {number} The index behind the closing quote, or the end of the scanned string.
 */
function skipString (text, openIndex) {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return index + 1
}

/**
 * The span a comment occupies in a text, in the coordinates of that text, and which of the two kinds it is.
 * @typedef {{ start: number, end: number, isInline: boolean }} CommentSpan
 */
/**
 * Finds the spans the comments of a text occupy in it, block comments and inline ones alike. A double slash belonging to an address opens no comment, whether the address is quoted or bare inside `url()`, and neither does a slash an escape spells wherever it stands; a block comment runs to its `*\/` and an inline one to the end of its line.
 *
 * The span of a block comment holds its delimiters, since the two of them are as much the comment as its text is. The span of an inline comment ends where the break that closes it begins, the break itself staying outside: a caller taking the comment out of the text keeps the line it stood on. A syntax that spells no comment with a double slash — plain CSS is one — has none to find, and the caller says so. The pair is then two characters of code like any other, and the second of them opens a block comment where a `*` follows it: `//*c*\/` holds one comment in such a file and none of the other kind, which is the reading that keeps `1px //*c,d*\/,2px` in one piece.
 * @param {string} text - The text to scan.
 * @param {boolean} [endsOnFormFeed] - True where the syntax that spelled the text reads a line in a form feed, which {@link endsInlineCommentOnFormFeed} answers for a node.
 * @param {boolean} [spellsInlineComments] - False where the syntax that spelled the text writes no comment with a double slash, which {@link readsInlineComments} answers for a node.
 * @returns {CommentSpan[]} The spans, in the coordinates of the scanned text.
 */
export function findCommentSpans (text, endsOnFormFeed = false, spellsInlineComments = true) {
	/** @type {CommentSpan[]} */
	let spans = []
	let index = 0
	// Whether what the loop has just stepped over is spelled the way a name is, which is what `skipUrl` needs to know about the run in front of the address it is offered. It opens false, an address opening the text having no name in front of itself.
	let behindIdentifier = false

	while (index < text.length) {
		let character = text[index]
		let next = text[index + 1]

		if (character === `\\`) {
			// A backslash spells the character behind it into an ordinary one everywhere code stands, and not only inside the `url()` and the quoted string whose own loops already step over one. `a\//b` opens no comment — Less compiles it to `a\/ / b`, and Sass hands it back as it came — and neither does `a\"b`, whose quotation mark used to open a string that ran to the end of the text and took every comment behind it with it. Inside the text of a comment no syntax reads an escape, and none is read here either: a block comment is skipped to its closing delimiter and an inline one to its break, so the loop never reaches a backslash standing in either.
			//
			// An escape spells a letter of a name as readily as it takes the meaning from a delimiter, so an address is looked for from the backslash rather than from behind it: `\75 rl(http://x)` and `\url(http://x)` are the token that `url(http://x)` is. Where no address is spelled there the escape is stepped over whole, so that the first backslash of `\\//` escapes the second rather than the slash, and so that the next question about a name is put behind the whole of this escape rather than in the middle of it.
			let behindUrl = skipUrl(text, index, behindIdentifier)

			if (behindUrl === index) {
				let escaped = readIdentifierCharacter(text, index)

				index = escaped.end
				behindIdentifier = escaped.character !== undefined
			}
			else {
				index = behindUrl
				behindIdentifier = false
			}
		}
		else if (character === `"` || character === `'`) {
			index = skipString(text, index)
			behindIdentifier = false
		}
		else if (character === `u` || character === `U`) {
			let behindUrl = skipUrl(text, index, behindIdentifier)

			if (behindUrl === index) {
				index += 1
				behindIdentifier = true
			}
			else {
				index = behindUrl
				behindIdentifier = false
			}
		}
		else if (character === `/` && next === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)
			let end = closeIndex === -1 ? text.length : closeIndex + 2

			spans.push({ start: index, end, isInline: false })
			index = end
			behindIdentifier = false
		}
		else if (character === `/` && next === `/` && spellsInlineComments) {
			// A line feed is not the only break that closes a comment: a carriage return closes one as well, in Sass by its own reading of a line and in Less by the line endings it normalises before parsing. A form feed is a line to Sass and to nobody else, so the caller says whether the text it holds was spelled by a syntax that reads one. Where nothing is said, the comment is taken for the longer of the two, which only ever hides code from a rule, while taking it for the shorter hands the rule the text of a comment to work on.
			let end = findLineBreak(text, index, endsOnFormFeed)

			spans.push({ start: index, end, isInline: true })
			index = end
			behindIdentifier = false
		}
		else {
			// A closing brace is no code point of an identifier and is counted here all the same, since the interpolation it closes stands where a run of a name stands: `@{prefix}url(` and `#{$p}url(` each spell one name, the way `image-url(` does. `findFunctionArgumentSpans` puts the same predicate to the same text and leaves the brace out, because the question there is what a call is named — and an interpolation names nothing that can be looked up.
			behindIdentifier = character === `}` || IDENTIFIER_CODE_POINT.test(character)
			index += 1
		}
	}

	return spans
}
