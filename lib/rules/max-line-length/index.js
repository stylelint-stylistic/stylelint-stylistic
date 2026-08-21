import styleSearch from "style-search"
import stylelint from "stylelint"

import { EVERY_IMPORT_ADDRESS, EVERY_URL_CONTENT, LEADING_WHITESPACE_RUN } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { optionsMatches } from "../../utils/optionsMatches/index.js"
import { isNumber, isRegExp, isString } from "../../utils/validateTypes/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `max-line-length`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (max) => `Expected line length to be no more than ${max} ${max === 1 ? `character` : `characters`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/** The spans a line's length is not counted over: what a `url()` holds, and the address of an `@import`. Neither can be broken across lines, so neither is the author's to shorten. */
const EXCLUDED_PATTERNS = [
	EVERY_URL_CONTENT,
	EVERY_IMPORT_ADDRESS,
]

/**
 * Limits the length of a line.
 * @type {import('stylelint').Rule}
 */
function rule (primary, secondaryOptions) {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: isNumber,
			},
			{
				actual: secondaryOptions,
				possible: {
					ignore: [`non-comments`, `comments`],
					ignorePattern: [isString, isRegExp],
					tabSize: [(value) => Number.isInteger(value) && value > 0],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		if (root.source === null) throw new Error(`The root node must have a source`)

		let ignoreNonComments = optionsMatches(secondaryOptions, `ignore`, `non-comments`)
		let ignoreComments = optionsMatches(secondaryOptions, `ignore`, `comments`)
		let tabSize = secondaryOptions?.tabSize ?? 1
		let rootString = root.source.input.css
		// Array of skipped sub strings, i.e `url(...)`, `@import "..."`
		/** @type {Array<[number, number]>} */
		let skippedSubStrings = []
		let skippedSubStringsIndex = 0

		for (let pattern of EXCLUDED_PATTERNS) {
			for (let match of rootString.matchAll(pattern)) {
				let subMatch = match[1] || ``
				let startOfSubString = (match.index || 0) + (match[0] || ``).indexOf(subMatch)

				skippedSubStrings.push([startOfSubString, startOfSubString + subMatch.length])
			}
		}

		skippedSubStrings = skippedSubStrings.toSorted((a, b) => a[0] - b[0])

		// Check first line
		checkNewline({ endIndex: 0 })
		// Check subsequent lines
		styleSearch({ source: rootString, target: [`\n`], comments: `check` }, (match) => checkNewline(match))

		/**
		 * Reports a line length violation.
		 * @param {number} index - The index of the violation.
		 */
		function complain (index) {
			report({
				index,
				endIndex: index,
				result,
				ruleName,
				message: messages.expected,
				messageArgs: [primary],
				node: root,
			})
		}

		/**
		 * Takes every skipped substring standing on the current line off the queue.
		 * @param {number} start - The start index of the line.
		 * @param {number} end - The end index of the line.
		 * @returns {Array<[number, number]>} The spans of the excluded substrings inside the line.
		 */
		function popSubStrings (start, end) {
			/** @type {Array<[number, number]>} */
			let spans = []

			// A substring starting at or past the end of the line stands on a later line
			while (skippedSubStringsIndex < skippedSubStrings.length && skippedSubStrings[skippedSubStringsIndex][0] < end) {
				let [startSubString, endSubString] = skippedSubStrings[skippedSubStringsIndex]

				spans.push([Math.max(start, startSubString) - start, Math.min(end, endSubString) - start])
				skippedSubStringsIndex += 1
			}

			return spans
		}

		/**
		 * Measures a line in columns, a tab reaching the next tab stop, less the columns the excluded substrings take.
		 * @param {string} lineText - The text of the line.
		 * @param {Array<[number, number]>} excludedSpans - The spans of the excluded substrings inside the line.
		 * @returns {number} The width of the line without the excluded substrings.
		 */
		function measureLine (lineText, excludedSpans) {
			let column = 0
			let excluded = 0

			for (let index = 0; index < lineText.length; index += 1) {
				let width = lineText[index] === `\t` ? tabSize - (column % tabSize) : 1

				if (excludedSpans.some(([from, to]) => index >= from && index < to)) excluded += width

				column += width
			}

			return column - excluded
		}

		/**
		 * Checks a newline for line length violations.
		 * @param {import('style-search').StyleSearchMatch | { endIndex: number }} match - The style search match.
		 * @returns {void}
		 */
		function checkNewline (match) {
			let nextNewlineIndex = rootString.indexOf(`\n`, match.endIndex)

			if (rootString[nextNewlineIndex - 1] === `\r`) nextNewlineIndex -= 1

			// Accommodate last line
			if (nextNewlineIndex === -1) nextNewlineIndex = rootString.length

			let excludedSpans = popSubStrings(match.endIndex, nextNewlineIndex)
			let lineText = rootString.slice(match.endIndex, nextNewlineIndex)

			// Case sensitive ignorePattern match
			if (optionsMatches(secondaryOptions, `ignorePattern`, lineText)) return

			// A line no longer than the max is left alone, so everything below this is about the lines that are longer. The length is measured with the arguments of a `url()` and the URL of an `@import` taken out of it.
			if (measureLine(lineText, excludedSpans) <= primary) return

			let complaintIndex = nextNewlineIndex - 1

			if (ignoreComments) {
				if (`insideComment` in match && match.insideComment) return

				// This trimming business is to notice when the line starts a comment but that comment is indented, e.g.
				//       /* something here */
				let nextTwoChars = rootString.slice(match.endIndex).trim().slice(0, 2)

				if (nextTwoChars === `/*` || nextTwoChars === `//`) return
			}

			if (ignoreNonComments) {
				if (`insideComment` in match && match.insideComment) return complain(complaintIndex)

				// This trimming business is to notice when the line starts a comment but that comment is indented, e.g.
				//       /* something here */
				let nextTwoChars = rootString.slice(match.endIndex).trim().slice(0, 2)

				if (nextTwoChars !== `/*` && nextTwoChars !== `//`) return

				return complain(complaintIndex)
			}

			// If there are no spaces besides initial (indent) spaces, ignore it
			let lineString = rootString.slice(match.endIndex, nextNewlineIndex)

			if (!lineString.replace(LEADING_WHITESPACE_RUN, ``).includes(` `)) return

			return complain(complaintIndex)
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
