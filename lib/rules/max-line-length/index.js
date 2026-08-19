import styleSearch from "style-search"
import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { optionsMatches } from "../../utils/optionsMatches/index.js"
import { assert, isNumber, isRegExp, isString } from "../../utils/validateTypes/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `max-line-length`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (max) => `Expected line length to be no more than ${max} ${max === 1 ? `character` : `characters`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

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

		let EXCLUDED_PATTERNS = [
			/url\(\s*(\S.*\S)\s*\)/gui, // allow tab, whitespace in url content
			/@import\s+(['"].*['"])/gui,
		]

		let ignoreNonComments = optionsMatches(secondaryOptions, `ignore`, `non-comments`)
		let ignoreComments = optionsMatches(secondaryOptions, `ignore`, `comments`)
		let tabSize = secondaryOptions?.tabSize
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
		 * Attempts to pop a skipped substring from the current line.
		 * @param {number} start - The start index of the line.
		 * @param {number} end - The end index of the line.
		 * @returns {[number, number] | undefined} The span of the excluded substring inside the line, or nothing if none.
		 */
		function tryToPopSubString (start, end) {
			let skippedSubString = skippedSubStrings[skippedSubStringsIndex]

			assert(skippedSubString)

			let [startSubString, endSubString] = skippedSubString

			// Excluded substring does not presented in current line
			if (end < startSubString) return

			// Compute excluded substring span regarding to current line indexes
			/** @type {[number, number]} */
			let span = [Math.max(start, startSubString) - start, Math.min(end, endSubString) - start]

			// Current substring is out of range for next lines
			if (endSubString <= end) skippedSubStringsIndex += 1

			return span
		}

		/**
		 * Measures a line in columns, a tab reaching the next tab stop, less the columns an excluded substring takes.
		 * @param {string} lineText - The text of the line.
		 * @param {[number, number] | undefined} excludedSpan - The span of the excluded substring inside the line.
		 * @returns {number} The width of the line without the excluded substring.
		 */
		function measureLine (lineText, excludedSpan) {
			let [excludedFrom, excludedTo] = excludedSpan ?? [0, 0]
			let column = 0
			let excluded = 0

			for (let index = 0; index < lineText.length; index += 1) {
				let width = lineText[index] === `\t` ? tabSize - (column % tabSize) : 1

				if (index >= excludedFrom && index < excludedTo) excluded += width

				column += width
			}

			return column - excluded
		}

		/**
		 * Checks a newline for line length violations.
		 * @param {import('style-search').StyleSearchMatch | { endIndex: number }} match - The style search match
		 * @returns {void}
		 */
		function checkNewline (match) {
			let nextNewlineIndex = rootString.indexOf(`\n`, match.endIndex)

			if (rootString[nextNewlineIndex - 1] === `\r`) nextNewlineIndex -= 1

			// Accommodate last line
			if (nextNewlineIndex === -1) nextNewlineIndex = rootString.length

			let excludedSpan = skippedSubStrings[skippedSubStringsIndex] ? tryToPopSubString(match.endIndex, nextNewlineIndex) : undefined
			let lineText = rootString.slice(match.endIndex, nextNewlineIndex)

			// Case sensitive ignorePattern match
			if (optionsMatches(secondaryOptions, `ignorePattern`, lineText)) return

			// Without a tab size a tab is one character like any other; with one the line is measured
			// in columns, the way an editor with that tab size shows it.
			let excludedLength = excludedSpan ? excludedSpan[1] - excludedSpan[0] : 0
			let lineLength = tabSize ? measureLine(lineText, excludedSpan) : lineText.length - excludedLength

			// If the line's length is less than or equal to the specified
			// max, ignore it ... So anything below is liable to be complained about.
			// **Note that the length of any url arguments or import urls
			// are excluded from the calculation.**
			if (lineLength <= primary) return

			let complaintIndex = nextNewlineIndex - 1

			if (ignoreComments) {
				if (`insideComment` in match && match.insideComment) return

				// This trimming business is to notice when the line starts a
				// comment but that comment is indented, e.g.
				//       /* something here */
				let nextTwoChars = rootString.slice(match.endIndex).trim().slice(0, 2)

				if (nextTwoChars === `/*` || nextTwoChars === `//`) return
			}

			if (ignoreNonComments) {
				if (`insideComment` in match && match.insideComment) return complain(complaintIndex)

				// This trimming business is to notice when the line starts a
				// comment but that comment is indented, e.g.
				//       /* something here */
				let nextTwoChars = rootString.slice(match.endIndex).trim().slice(0, 2)

				if (nextTwoChars !== `/*` && nextTwoChars !== `//`) return

				return complain(complaintIndex)
			}

			// If there are no spaces besides initial (indent) spaces, ignore it
			let lineString = rootString.slice(match.endIndex, nextNewlineIndex)

			if (!lineString.replace(/^\s+/u, ``).includes(` `)) return

			return complain(complaintIndex)
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
