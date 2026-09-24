import { type Node, type Root, type Stringifier, stringify as postcssStringify } from "postcss"
import styleSearch, { type StyleSearchMatch } from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { LEADING_BYTE_ORDER_MARK, LEADING_WHITESPACE_RUN } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findAddressSpans } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { maskStrings } from "../../utils/maskStrings/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isNumber, isRegExp, isString } from "../../utils/validateTypes/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `max-line-length`

const MESSAGES = defineMessages({
	expected: (max) => `Expected line length to be no more than ${max} ${max === 1 ? `character` : `characters`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/**
 * Measures a line in columns, a tab reaching the next tab stop, less the excluded spans.
 *
 * One pointer walks the spans beside the line, since asking every span about every character is quadratic.
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

/** A stylesheet as the run leaves it: its text, and where each node opens in it, in print order. */
type PrintedStylesheet = {
	text: string,
	starts: Array<[number, Node]>,
}

/**
 * Prints a stylesheet as the run leaves it: the root printed by its syntax, less what the print adds around the stylesheet's own text — the byte order mark PostCSS writes back from the input's flag, and the host code a styled template's root prints around itself — so a root nothing wrote reads as its input does. Where each node opens is kept, so a line can be reported on the node it stands in.
 * @param root - The stylesheet.
 * @param result - The Stylelint result, which names the syntax.
 * @returns The text and the starts.
 */
function printStylesheet (root: Root, result: PostcssResult): PrintedStylesheet {
	let syntax = nodeSyntax(root, result)
	let print: Stringifier = syntax?.stringify ?? postcssStringify
	let text = ``
	let starts: Array<[number, Node]> = []
	let seen: Set<Node> = new Set()

	print(root, (part, node, type) => {
		if (node && node !== root && type !== `end` && !seen.has(node)) {
			seen.add(node)
			starts.push([text.length, node])
		}

		text += part
	})

	let { codeBefore, codeAfter } = root.raws
	let prefix = LEADING_BYTE_ORDER_MARK.test(text) ? 1 : 0

	if (codeBefore && text.startsWith(codeBefore, prefix)) prefix += codeBefore.length

	let end = codeAfter && text.endsWith(codeAfter) ? text.length - codeAfter.length : text.length

	return { text: text.slice(prefix, end), starts: starts.map(([start, node]) => [start - prefix, node]) }
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
		// The text the run leaves, printed as the syntax writes it: under `--fix` the file is written from the tree, so a line a fix lengthened or a node another rule built with no raw stands only there. The rule takes the last turn of the plugin's rules, so every write of theirs is in it; the rules of the core and of other plugins take theirs later
		let { text: rootString, starts } = printStylesheet(root, result)
		let anchor = 0
		// The spans left out of the count, in the source order the line queue reads them in; the comment-finding walk alone can say where an address closes and whether the text around it is code
		let skippedSubStrings: Array<[number, number]> = findAddressSpans(rootString, syntax.inlineComments(root, result), syntax.addressAtRules()).map(({ start, end }) => [start, end])
		let skippedSubStringsIndex = 0

		// Check first line
		checkNewline({ endIndex: 0 })
		// Check subsequent lines
		// The search reads a string by rules of its own, so it is handed none
		styleSearch({ source: maskStrings(rootString, syntax.commentSpans(rootString, root, result)), target: [`\n`], comments: `check` }, (match) => checkNewline(match))

		/**
		 * Reports a line over the limit.
		 * @param index - The index reported.
		 */
		function complain (index: number): void {
			// On the last node the print opened in front of the line's end, at the offset from that node's start, which Stylelint counts in the input from the node's place there: a file nothing wrote is reported where it always was, and under `--fix` the line stands where its node stood, so a `stylelint-disable` comment the file holds covers it. The lines are read in order, so the anchor only moves on
			while (anchor + 1 < starts.length && (starts[anchor + 1]?.[0] ?? Infinity) <= index) anchor += 1

			let held = starts[anchor]
			let [start, node]: [number, Node] = held && held[0] <= index ? held : [0, root]

			report({
				index: index - start,
				endIndex: index - start,
				result,
				ruleName,
				message: messages.expected,
				messageArgs: [primary],
				node,
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

			// No span reaches past the line's end: an address carrying a break is recorded as none
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

// Reads the text the plugin's writers leave, so it takes the last turn of the plugin's rules
export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule, defersToRunEnd: true })

export let { ruleName, messages } = createRule(css)
