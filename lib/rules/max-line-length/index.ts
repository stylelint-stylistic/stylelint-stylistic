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

/** The spans a line's length is not counted over besides the addresses the file's `url()` calls hold: the quoted address of an `@import`. Neither that nor an address is the author's to shorten, a string being closed by its own quotation mark and a `url()` token by its parenthesis. */
const EXCLUDED_PATTERNS = [EVERY_IMPORT_ADDRESS]

/**
 * Measures a line in columns, a tab reaching the next tab stop, less the columns the excluded substrings take.
 *
 * The spans are walked beside the line, one step each, rather than every span being asked about every character: a line holds as many addresses as the file writes on it, and a stylesheet printed on one line holds all of them, so asking each of them about each character costs the square of what the file is.
 *
 * One pointer is enough for spans that hold one another, which the two kinds do — the pattern that looks for the address of an `@import` runs to the last quotation mark of its line and swallows a `url()` written behind it, whose address is a span of its own ([#552](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/552)). The queue hands them over sorted by where each opens, so the pointer stops at the first span ending behind the character being measured: every span it has stepped over ends in front of that character, and every span behind the one it stopped at opens at or past where that one opens. A character two spans hold is therefore counted off once, and one no span holds is reached by none.
 * @param lineText - The text of the line.
 * @param excludedSpans - The spans of the excluded substrings inside the line, sorted by where each opens.
 * @param tabSize - The columns a tab reaches over, from the secondary options.
 * @returns The width of the line without the excluded substrings.
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

/**
 * Limits the length of a line.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, a number.
 * @param secondaryOptions - The secondary options: `ignore`, `ignorePattern` and `tabSize`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: number, secondaryOptions: {
	ignore?: (`non-comments` | `comments`) | (`non-comments` | `comments`)[],
	ignorePattern?: string | RegExp | (string | RegExp)[],
	tabSize?: number,
}): RuleCheck {
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
		// The spans the count leaves out: the address of every `url()` the file spells, and the quoted address of every `@import`
		let skippedSubStrings: Array<[number, number]> = []
		let skippedSubStringsIndex = 0

		// The addresses are found by the walk that finds the comments of a text rather than by a pattern, since each of the two is the other's exception: a `url(` written inside a comment or inside a quoted string opens no address, a name in front of one leaves an ordinary call whose arguments the author may break where they like, and the three letters of the name may each be spelled with an escape (#427). The walk is asked what the file spells, so it is told whether the file's own syntax spells a comment with a double slash — not whether such a comment survives in the text a rule reads, which is a question about a copy this rule never looks at
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
		 * Reports a line length violation.
		 * @param index - The index of the violation.
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
		 * Takes every skipped substring standing on the current line off the queue.
		 * @param start - The start index of the line.
		 * @param end - The end index of the line.
		 * @returns The spans of the excluded substrings inside the line.
		 */
		function popSubStrings (start: number, end: number): Array<[number, number]> {
			let spans: Array<[number, number]> = []

			// A substring starting at or past the end of the line stands on a later line. No substring reaches past the end of one: the address of an `@import` is looked for with a pattern whose capture stops at a break, and a run holding a break is no address of a `url()` either
			for (let next = skippedSubStrings[skippedSubStringsIndex]; next && next[0] < end; next = skippedSubStrings[skippedSubStringsIndex]) {
				let [startSubString, endSubString] = next

				spans.push([Math.max(start, startSubString) - start, Math.min(end, endSubString) - start])
				skippedSubStringsIndex += 1
			}

			return spans
		}

		/**
		 * Checks a newline for line length violations.
		 * @param match - The style search match.
		 * @returns Nothing; a line over the limit is reported, and one within it is left alone.
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

			// A line no longer than the max is left alone, so everything below this is about the lines that are longer. The length is measured with the address of a `url()` and the address of an `@import` taken out of it.
			if (measureLine(lineText, excludedSpans, tabSize) <= primary) return

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

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
