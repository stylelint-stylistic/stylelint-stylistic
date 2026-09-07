import styleSearch from "style-search"
import stylelint from "stylelint"

import { EVERY_LINE_BREAK, LINE_BREAK, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isOnlyWhitespace } from "../../utils/isOnlyWhitespace/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `no-eol-whitespace`

const MESSAGES = defineMessages({
	rejected: `Unexpected whitespace at end of line`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

const WHITESPACES_TO_REJECT = new Set([` `, `\t`])

/** The break as a string, since `styleSearch` takes no pattern. */
const LINE_BREAK_CHARACTERS = [`\n`]

/**
 * Trims trailing spaces and tabs.
 * @param str - The string.
 * @returns The trimmed string.
 */
function fixString (str: string): string {
	return str.replace(TRAILING_SPACES_AND_TABS, ``)
}

/**
 * Finds the nearest line break behind a place.
 * @param string - The text.
 * @param from - Look back from here, inclusive; the end by default.
 * @returns The index of the break, or -1.
 */
function lastLineBreakIndex (string: string, from: number = string.length - 1): number {
	for (let index = Math.min(from, string.length - 1); index >= 0; index -= 1) if (LINE_BREAK.test(string.charAt(index))) return index

	return -1
}

/**
 * Finds where a line's trailing whitespace starts.
 * @param lastEOLIndex - The line's end.
 * @param string - The source.
 * @param options - Whether empty lines are ignored, and whether the line opens the root.
 * @returns The start index, or -1.
 */
function findErrorStartIndex (lastEOLIndex: number, string: string, options: {
	ignoreEmptyLines: boolean,
	isRootFirst: boolean,
}): number {
	let { ignoreEmptyLines, isRootFirst } = options

	let eolWhitespaceIndex = lastEOLIndex - 1

	// A Windows pair's carriage return belongs to the break
	if (string.charAt(eolWhitespaceIndex) === `\r`) eolWhitespaceIndex -= 1

	// No whitespace before the break
	if (!WHITESPACES_TO_REJECT.has(string.charAt(eolWhitespaceIndex))) return -1

	if (ignoreEmptyLines) {
		// Only whitespace since the previous break
		let beforeNewlineIndex = lastLineBreakIndex(string, eolWhitespaceIndex)

		if (beforeNewlineIndex >= 0 || isRootFirst) {
			let line = string.slice(Math.max(0, beforeNewlineIndex), eolWhitespaceIndex)

			if (isOnlyWhitespace(line)) return -1
		}
	}

	return eolWhitespaceIndex
}

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/** The secondary options. */
export type SecondaryOptions = {

	/** `empty-lines` allows whitespace on a line holding nothing else. */
	ignore?: `empty-lines` | `empty-lines`[],
}

/**
 * Disallows end-of-line whitespace.
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
			},
			{
				optional: true,
				actual: secondaryOptions,
				possible: {
					ignore: [`empty-lines`],
				},
			},
		)

		if (!validOptions) return

		let ignoreEmptyLines = optionsMatches(secondaryOptions, `ignore`, `empty-lines`)

		let rootString = (root.source && root.source.input.css) || ``

		/**
		 * Reports trailing whitespace at an index.
		 * @param index - The offset in the root's source where the whitespace starts.
		 */
		function reportFromIndex (index: number): void {
			report({
				message: messages.rejected,
				node: root,
				index,
				endIndex: index,
				result,
				ruleName,
				fix,
			})
		}

		eachEolWhitespace(rootString, reportFromIndex, { isRootFirst: true })

		let errorIndex = findErrorStartIndex(rootString.length, rootString, {
			ignoreEmptyLines,
			isRootFirst: true,
		})

		if (errorIndex > -1) reportFromIndex(errorIndex)

		/**
		 * Calls back with the index of each line's trailing whitespace.
		 * @param string - The text.
		 * @param callback - Takes the index.
		 * @param options - `isRootFirst` marks the root's first token, `isPlainText` prose.
		 */
		function eachEolWhitespace (string: string, callback: (index: number) => void, options: {
			isRootFirst?: boolean,
			isPlainText?: boolean,
		} = {}): void {
			let { isRootFirst = false, isPlainText = false } = options

			/**
			 * Reports the whitespace at a line ending.
			 * @param startIndex - The line ending.
			 */
			function handleEol (startIndex: number): void {
				let index = findErrorStartIndex(startIndex, string, {
					ignoreEmptyLines,
					isRootFirst,
				})

				if (index > -1) callback(index)
			}

			// A CSS scan of prose takes an apostrophe for an unclosed string
			if (isPlainText) {
				for (let { index } of string.matchAll(EVERY_LINE_BREAK)) handleEol(index)

				return
			}

			styleSearch(
				{
					source: string,
					target: LINE_BREAK_CHARACTERS,
					comments: `check`,
				},
				(match) => {
					handleEol(match.startIndex)
				},
			)
		}

		/** Trims the end of every line of every text a node holds. */
		function fix (): void {
			let isRootFirst = true

			root.walk((node) => {
				fixText(
					node.raws.before,
					(fixed) => {
						node.raws.before = fixed
					},
					{ isRootFirst },
				)
				isRootFirst = false

				if (isAtRule(node)) {
					fixText(node.raws.afterName, (fixed) => {
						node.raws.afterName = fixed
					})

					fixText(syntax.read(node), (fixed) => {
						syntax.write(node, fixed)
					})
				}

				// An inline comment in the selector may end in a space the raw hides
				if (isRule(node)) {
					fixText(syntax.read(node), (fixed) => {
						syntax.write(node, fixed)
					})
				}

				if (isAtRule(node) || isRule(node) || isDeclaration(node)) {
					fixText(node.raws.between, (fixed) => {
						node.raws.between = fixed
					})
				}

				if (isDeclaration(node)) {
					fixText(syntax.read(node), (fixed) => {
						syntax.write(node, fixed)
					})
				}

				if (isComment(node)) {
					fixText(node.raws.left, (fixed) => {
						node.raws.left = fixed
					})

					if (syntax.isStandardComment(node)) {
						fixText(node.raws.right, (fixed) => {
							node.raws.right = fixed
						})
					}
					else {
						// An inline comment ends on a line feed only, so a bare carriage return or form feed at the file's end stays in `raws.right`
						fixText(node.raws.right, (fixed) => {
							node.raws.right = fixed
						})

						// A whitespace-only inline comment is an empty text with the whitespace in `raws.left`; trimming `raws.left` under a text would close `// c` onto it
						if (node.raws.right) node.raws.right = fixString(node.raws.right)
						else if (!node.text && node.raws.left) node.raws.left = fixString(node.raws.left)
					}

					// The comment body is prose
					fixText(
						node.text,
						(fixed) => {
							node.text = fixed
						},
						{ isPlainText: true },
					)
				}

				if (isAtRule(node) || isRule(node)) {
					fixText(node.raws.after, (fixed) => {
						node.raws.after = fixed
					})
				}
			})

			fixText(
				root.raws.after,
				(fixed) => {
					root.raws.after = fixed
				},
				{ isRootFirst },
			)

			if (typeof root.raws.after === `string`) {
				let lastEOL = lastLineBreakIndex(root.raws.after)

				if (lastEOL !== root.raws.after.length - 1) root.raws.after = root.raws.after.slice(0, lastEOL + 1) + fixString(root.raws.after.slice(lastEOL + 1))
			}
		}

		/**
		 * Trims the end of every line of a text.
		 * @param value - The text.
		 * @param fixFn - Takes the trimmed text.
		 * @param options - For `eachEolWhitespace`.
		 */
		function fixText (value: string | undefined, fixFn: (text: string) => void, options?: {
			isRootFirst?: boolean,
			isPlainText?: boolean,
		}): void {
			if (!value) return

			let fixed = ``
			let lastIndex = 0

			eachEolWhitespace(
				value,
				(index) => {
					let newlineIndex = index + 1

					fixed += fixString(value.slice(lastIndex, newlineIndex))
					lastIndex = newlineIndex
				},
				options,
			)

			if (lastIndex) {
				fixed += value.slice(lastIndex)
				fixFn(fixed)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
