/**
 * The span an inline comment occupies in a value, in the coordinates of the file, and how far the copy a syntax rewrote its comments in has run away from that value by the end of the comment.
 * @typedef {{ start: number, end: number, delta?: number }} InlineCommentSpan
 */

/**
 * Finds the spans the inline comments of a string occupy in it. A double slash belonging to an address opens no comment, whether the address is quoted or bare inside `url()`, and neither does one inside a block comment; a comment ends with its line rather than with the string.
 * @param {string} text - The string to scan.
 * @param {boolean} [endsOnFormFeed] - True where the syntax that spelled the string reads a line in a form feed, which {@link endsInlineCommentOnFormFeed} answers for a node.
 * @returns {InlineCommentSpan[]} The spans, in the coordinates of the scanned string.
 */
export function findInlineCommentSpans (text, endsOnFormFeed = false) {
	/** @type {InlineCommentSpan[]} */
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

			index = closeIndex === -1 ? text.length : closeIndex + 2
		}
		else if (character === `/` && next === `/`) {
			// A line feed is not the only break that closes a comment: a carriage return closes one as
			// well, in Sass by its own reading of a line and in Less by the line endings it normalises
			// before parsing. A form feed is a line to Sass and to nobody else, so the caller says
			// whether the string it holds was spelled by a syntax that reads one. Where nothing is
			// said, the comment is taken for the longer of the two, which only ever hides code from a
			// rule, while taking it for the shorter hands the rule the text of a comment to work on.
			let end = findLineBreak(text, index, endsOnFormFeed)

			spans.push({ start: index, end })
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
