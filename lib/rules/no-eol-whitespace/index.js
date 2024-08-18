import stylelint from "stylelint"
import styleSearch from "style-search"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isOnlyWhitespace from "../../utils/isOnlyWhitespace.js"
import isStandardSyntaxComment from "../../utils/isStandardSyntaxComment.js"
import optionsMatches from "../../utils/optionsMatches.js"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `no-eol-whitespace`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	rejected: `Unexpected whitespace at end of line`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

const whitespacesToReject = new Set([` `, `\t`])

/**
 * @param {string} str
 * @returns {string}
 */
function fixString (str) {
	return str.replace(/[ \t]+$/, ``)
}

/**
 * @param {number} lastEOLIndex
 * @param {string} string
 * @param {{ ignoreEmptyLines: boolean, isRootFirst: boolean }} options
 * @returns {number}
 */
function findErrorStartIndex (lastEOLIndex, string, { ignoreEmptyLines, isRootFirst }) {
	const eolWhitespaceIndex = lastEOLIndex - 1

	// If the character before newline is not whitespace, ignore
	if (!whitespacesToReject.has(string.charAt(eolWhitespaceIndex))) {
		return -1
	}

	if (ignoreEmptyLines) {
		// If there is only whitespace between the previous newline and
		// this newline, ignore
		const beforeNewlineIndex = string.lastIndexOf(`\n`, eolWhitespaceIndex)

		if (beforeNewlineIndex >= 0 || isRootFirst) {
			const line = string.substring(beforeNewlineIndex, eolWhitespaceIndex)

			if (isOnlyWhitespace(line)) {
				return -1
			}
		}
	}

	return eolWhitespaceIndex
}

/** @type {import('stylelint').Rule} */
function rule (primary, secondaryOptions) {
	return (root, result) => {
		const validOptions = validateOptions(
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

		if (!validOptions) {
			return
		}

		const ignoreEmptyLines = optionsMatches(secondaryOptions, `ignore`, `empty-lines`)

		const rootString = (root.source && root.source.input.css) || ``

		/**
		 * @param {number} index
		 */
		function reportFromIndex (index) {
			report({
				message: messages.rejected,
				node: root,
				index,
				result,
				ruleName,
				fix,
			})
		}

		eachEolWhitespace(rootString, reportFromIndex, true)

		const errorIndex = findErrorStartIndex(rootString.length, rootString, {
			ignoreEmptyLines,
			isRootFirst: true,
		})

		if (errorIndex > -1) {
			reportFromIndex(errorIndex)
		}

		/**
		 * Iterate each whitespace at the end of each line of the given string.
		 * @param {string} string - the source code string
		 * @param {(index: number) => void} callback - callback the whitespace index at the end of each line.
		 * @param {boolean} isRootFirst - set `true` if the given string is the first token of the root.
		 * @returns {void}
		 */
		function eachEolWhitespace (string, callback, isRootFirst) {
			styleSearch(
				{
					source: string,
					target: [`\n`, `\r`],
					comments: `check`,
				},
				(match) => {
					const index = findErrorStartIndex(match.startIndex, string, {
						ignoreEmptyLines,
						isRootFirst,
					})

					if (index > -1) {
						callback(index)
					}
				},
			)
		}

		function fix () {
			let isRootFirst = true

			root.walk((node) => {
				fixText(
					node.raws.before,
					(fixed) => {
						node.raws.before = fixed
					},
					isRootFirst,
				)
				isRootFirst = false

				if (isAtRule(node)) {
					fixText(node.raws.afterName, (fixed) => {
						node.raws.afterName = fixed
					})

					const rawsParams = node.raws.params

					if (rawsParams) {
						fixText(rawsParams.raw, (fixed) => {
							rawsParams.raw = fixed
						})
					} else {
						fixText(node.params, (fixed) => {
							node.params = fixed
						})
					}
				}

				if (isRule(node)) {
					const rawsSelector = node.raws.selector

					if (rawsSelector) {
						fixText(rawsSelector.raw, (fixed) => {
							rawsSelector.raw = fixed
						})
					} else {
						fixText(node.selector, (fixed) => {
							node.selector = fixed
						})
					}
				}

				if (isAtRule(node) || isRule(node) || isDeclaration(node)) {
					fixText(node.raws.between, (fixed) => {
						node.raws.between = fixed
					})
				}

				if (isDeclaration(node)) {
					const rawsValue = node.raws.value

					if (rawsValue) {
						fixText(rawsValue.raw, (fixed) => {
							rawsValue.raw = fixed
						})
					} else {
						fixText(node.value, (fixed) => {
							node.value = fixed
						})
					}
				}

				if (isComment(node)) {
					fixText(node.raws.left, (fixed) => {
						node.raws.left = fixed
					})

					if (!isStandardSyntaxComment(node)) {
						node.raws.right = node.raws.right && fixString(node.raws.right)
					} else {
						fixText(node.raws.right, (fixed) => {
							node.raws.right = fixed
						})
					}

					fixText(node.text, (fixed) => {
						node.text = fixed
					})
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
				isRootFirst,
			)

			if (typeof root.raws.after === `string`) {
				const lastEOL = Math.max(
					root.raws.after.lastIndexOf(`\n`),
					root.raws.after.lastIndexOf(`\r`),
				)

				if (lastEOL !== root.raws.after.length - 1) {
					root.raws.after = root.raws.after.slice(0, lastEOL + 1) + fixString(root.raws.after.slice(lastEOL + 1))
				}
			}
		}

		/**
		 * @param {string | undefined} value
		 * @param {(text: string) => void} fixFn
		 * @param {boolean} isRootFirst
		 */
		function fixText (value, fixFn, isRootFirst = false) {
			if (!value) {
				return
			}

			let fixed = ``
			let lastIndex = 0

			eachEolWhitespace(
				value,
				(index) => {
					const newlineIndex = index + 1

					fixed += fixString(value.slice(lastIndex, newlineIndex))
					lastIndex = newlineIndex
				},
				isRootFirst,
			)

			if (lastIndex) {
				fixed += value.slice(lastIndex)
				fixFn(fixed)
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
