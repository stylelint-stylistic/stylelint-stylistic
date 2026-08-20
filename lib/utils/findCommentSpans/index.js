/**
 * The span a comment occupies in a text, in the coordinates of that text, and which of the two kinds it is.
 * @typedef {{ start: number, end: number, isInline: boolean }} CommentSpan
 */

/**
 * Finds the spans the comments of a text occupy in it, block comments and inline ones alike. A double slash belonging to an address opens no comment, whether the address is quoted or bare inside `url()`; a block comment runs to its `*\/` and an inline one to the end of its line.
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

	while (index < text.length) {
		let character = text[index]
		let next = text[index + 1]

		if (character === `"` || character === `'`) {
			index = skipString(text, index)
		}
		else if (character === `u` || character === `U`) {
			let behindUrl = skipUrl(text, index)

			index = behindUrl === index ? index + 1 : behindUrl
		}
		else if (character === `/` && next === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)
			let end = closeIndex === -1 ? text.length : closeIndex + 2

			spans.push({ start: index, end, isInline: false })
			index = end
		}
		else if (character === `/` && next === `/` && spellsInlineComments) {
			// A line feed is not the only break that closes a comment: a carriage return closes one as well, in Sass by its own reading of a line and in Less by the line endings it normalises before parsing. A form feed is a line to Sass and to nobody else, so the caller says whether the text it holds was spelled by a syntax that reads one. Where nothing is said, the comment is taken for the longer of the two, which only ever hides code from a rule, while taking it for the shorter hands the rule the text of a comment to work on.
			let end = findLineBreak(text, index, endsOnFormFeed)

			spans.push({ start: index, end, isInline: true })
			index = end
		}
		else {
			index += 1
		}
	}

	return spans
}

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
 * Skips a `url()` token, whose address carries its double slashes as ordinary characters whether it is quoted or bare. The name has to stand on its own — `image-url(` and `@{prefix}url(` end in the same four characters while being ordinary calls, whose arguments may hold a comment — and the parentheses are counted rather than searched for, since an interpolated address brings its own. A parenthesis that is escaped, quoted or commented out is none, and a token left open is taken for no token at all, so that a comment standing behind it is still seen.
 * @param {string} text - The string being scanned.
 * @param {number} openIndex - The index the token would start at.
 * @returns {number} The index behind the closing parenthesis, or the given one if no `url()` starts and ends there.
 */
function skipUrl (text, openIndex) {
	if (text.slice(openIndex, openIndex + 4).toLowerCase() !== `url(`) return openIndex

	if (openIndex > 0 && (/[\w}-]/u).test(text[openIndex - 1])) return openIndex

	let depth = 1
	let index = openIndex + 4

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
