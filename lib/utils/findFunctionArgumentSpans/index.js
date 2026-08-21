import { LINE_BREAK, TRAILING_FUNCTION_NAME } from "../../regexps.js"

/**
 * Skips a quoted string, from its opening quote to the character behind its closing one.
 * @param {string} text - The text being scanned.
 * @param {number} openIndex - The index of the opening quote.
 * @returns {number} The index behind the closing quote, or the end of the scanned text.
 */
function skipString (text, openIndex) {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return index + 1
}

/**
 * The span the arguments of one function call occupy in a text, from the character behind its opening parenthesis to its closing one, under the name the call was made by.
 * @typedef {{ start: number, end: number, name: string }} FunctionArgumentSpan
 */
/**
 * Finds the spans the arguments of the function calls of a text occupy in it.
 *
 * A parenthesis opens a call only where an identifier stands in front of it: `url(` and `translate(` open one, while the parentheses of `(min-width: 1px)` and of `screen and (color)` group a media feature and open nothing. `style-search` answers the same question of itself, and answers it wrongly for a text that opens on a parenthesis — it reads the character in front of the first one out of nothing at all and finds a letter there — which is exactly the shape a set of media parameters usually has.
 *
 * A call standing inside a call gets a span of its own, so the spans may lie inside one another; every one of them covers its own arguments and nothing else. A call left open reaches the end of the text, since the text behind it is the arguments as far as anything can tell. A parenthesis that stands inside a string or a comment opens and closes nothing, and neither does one that is escaped, so the address of `url(a\)b)` keeps the parenthesis it spells.
 *
 * A name is what an identifier spells, and an interpolation spells none: `#{$a}(1,2)` and `@{v}(1,2)` name nothing that can be looked up, and `#{$q}(min-width: 1px)` is a media feature behind an interpolated query. The two readings cannot be told apart from the text, and taking such a parenthesis for a group is the reading that loses nothing — a check is made where perhaps none was needed, rather than dropped where one was.
 *
 * The name a call was made by comes with its span, since a caller may know a word that names no function however a file spells it: `and(min-width: 1px)` is a media feature written without the space the grammar asks for, and the rules that read a media query list say so.
 * @param {string} text - The text to scan.
 * @returns {FunctionArgumentSpan[]} The spans, in the coordinates of the scanned text.
 */
export function findFunctionArgumentSpans (text) {
	/** @type {FunctionArgumentSpan[]} */
	let spans = []

	/** @type {({ start: number, name: string } | null)[]} */
	let openings = []
	let index = 0

	while (index < text.length) {
		let character = text[index]
		let next = text[index + 1]

		if (character === `"` || character === `'`) {
			index = skipString(text, index)
		}
		else if (character === `/` && next === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)

			index = closeIndex === -1 ? text.length : closeIndex + 2
		}
		else if (character === `/` && next === `/`) {
			let breakIndex = text.slice(index).search(LINE_BREAK)

			index = breakIndex === -1 ? text.length : index + breakIndex
		}
		else if (character === `\\`) {
			index += 2
		}
		else if (character === `(`) {
			// The character in front of the first parenthesis of a text is no character, so the call it would open is no call: nothing is named there
			let name = text.slice(0, index).match(TRAILING_FUNCTION_NAME)[0]

			openings.push(name === `` ? null : { start: index + 1, name: name.toLowerCase() })
			index += 1
		}
		else if (character === `)`) {
			let opening = openings.pop()

			if (opening) spans.push({ start: opening.start, end: index, name: opening.name })

			index += 1
		}
		else {
			index += 1
		}
	}

	// A call the text never closes holds everything behind it
	for (let opening of openings) {
		if (opening) spans.push({ start: opening.start, end: text.length, name: opening.name })
	}

	return spans
}
