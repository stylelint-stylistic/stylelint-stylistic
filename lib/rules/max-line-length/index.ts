import styleSearch, { type StyleSearchMatch } from "style-search"
import stylelint from "stylelint"

import { EVERY_IMPORT_ADDRESS, LEADING_WHITESPACE_RUN } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findAddressSpans } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isNumber, isRegExp, isString } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `max-line-length`

const MESSAGES = defineMessages({
	expected: (max) => `Expected line length to be no more than ${max} ${max === 1 ? `character` : `characters`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/** Spans not counted besides `url()` addresses. */
const EXCLUDED_PATTERNS = [EVERY_IMPORT_ADDRESS]

/**
 * Measures a line in columns, a tab reaching the next tab stop, less the excluded spans.
 *
 * One pointer walks the spans beside the line, since asking every span about every character is quadratic; a character two spans hold is counted off once ([#552](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/552)).
 * @param lineText - The text of the line measured.
 * @param excludedSpans - The excluded spans, sorted by start.
 * @param tabSize - The columns of a tab.
 * @returns The width less the excluded spans.
 */
function measureLine (lineText: string, excludedSpans: Array<[number, number]>, tabSize: number): number {
	let column = 0
	let excluded = 0
	let span = 0

	for (let index = 0; index < lineText.length; index += 1) {
		let width = lineText[index] === `\t` ? tabSize - (column % tabSize) : 1

		while (span < excludedSpans.length && (excludedSpans[span] ?? [0, 0])[1] <= index) span += 1

		if (index >= (excludedSpans[span] ?? [Infinity, Infinity])[0]) excluded += width

		column += width
	}

	return column - excluded
}

/** The most characters allowed on a line. */
export type PrimaryOption = number

/** The secondary options. */
export type SecondaryOptions = {

	/** `non-comments` limits the lines of comments only, `comments` the lines outside them only. */
	ignore?: (`non-comments` | `comments`) | (`non-comments` | `comments`)[],

	/** Lines passed over, by pattern. */
	ignorePattern?: string | RegExp | (string | RegExp)[],

	/** The width a tab reaches the next stop of; one character otherwise. */
	tabSize?: number,
}

/**
 * Limits the length of a line.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
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
					tabSize: [(value): boolean => isNumber(value) && Number.isInteger(value) && value > 0],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		if (root.source === undefined) throw new Error(`The root node must have a source`)

		let ignoreNonComments = optionsMatches(secondaryOptions, `ignore`, `non-comments`)
		let ignoreComments = optionsMatches(secondaryOptions, `ignore`, `comments`)
		let tabSize = secondaryOptions?.tabSize ?? 1
		let rootString = root.source.input.css
		// The spans left out of the count
		let skippedSubStrings: Array<[number, number]> = []
		let skippedSubStringsIndex = 0

		// From the comment-finding walk: a `url(` inside a comment or string opens no address, and each letter of `url` may be an escape (#427)
		for (let { start, end } of findAddressSpans(rootString, syntax.inlineComments(root, result).spells)) skippedSubStrings.push([start, end])

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
		 * Reports a line over the limit.
		 * @param index - The index reported.
		 */
		function complain (index: number): void {
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
		 * Takes every excluded span on the line off the queue.
		 * @param start - The line's start index.
		 * @param end - The line's end index.
		 * @returns The spans, in the line's coordinates.
		 */
		function popSubStrings (start: number, end: number): Array<[number, number]> {
			let spans: Array<[number, number]> = []

			// No span reaches past the line's end: the `@import` capture stops at a break, an address holds none
			for (let next = skippedSubStrings[skippedSubStringsIndex]; next && next[0] < end; next = skippedSubStrings[skippedSubStringsIndex]) {
				let [startSubString, endSubString] = next

				spans.push([Math.max(start, startSubString) - start, Math.min(end, endSubString) - start])
				skippedSubStringsIndex += 1
			}

			return spans
		}

		/**
		 * Checks the line a match opens.
		 * @param match - The style-search match, or the first line's start.
		 * @returns Nothing; a line over the limit is reported.
		 */
		function checkNewline (match: StyleSearchMatch | { endIndex: number }): void {
			let nextNewlineIndex = rootString.indexOf(`\n`, match.endIndex)

			if (rootString[nextNewlineIndex - 1] === `\r`) nextNewlineIndex -= 1

			// Accommodate last line
			if (nextNewlineIndex === -1) nextNewlineIndex = rootString.length

			let excludedSpans = popSubStrings(match.endIndex, nextNewlineIndex)
			let lineText = rootString.slice(match.endIndex, nextNewlineIndex)

			// Case sensitive ignorePattern match
			if (optionsMatches(secondaryOptions, `ignorePattern`, lineText)) return

			// Measured without the addresses
			if (measureLine(lineText, excludedSpans, tabSize) <= primary) return

			let complaintIndex = nextNewlineIndex - 1

			if (ignoreComments) {
				if (`insideComment` in match && match.insideComment) return

				// Trimmed past the indent
				let nextTwoChars = rootString.slice(match.endIndex).trim().slice(0, 2)

				if (nextTwoChars === `/*` || nextTwoChars === `//`) return
			}

			if (ignoreNonComments) {
				if (`insideComment` in match && match.insideComment) return complain(complaintIndex)

				// Trimmed past the indent
				let nextTwoChars = rootString.slice(match.endIndex).trim().slice(0, 2)

				if (nextTwoChars !== `/*` && nextTwoChars !== `//`) return

				return complain(complaintIndex)
			}

			// A line with no space past its indent is left alone
			let lineString = rootString.slice(match.endIndex, nextNewlineIndex)

			if (!lineString.replace(LEADING_WHITESPACE_RUN, ``).includes(` `)) return

			return complain(complaintIndex)
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
