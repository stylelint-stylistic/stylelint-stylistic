import styleSearch from "style-search"
import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.js"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isOnlyWhitespace } from "../../utils/isOnlyWhitespace/index.js"
import { isStandardSyntaxComment } from "../../utils/isStandardSyntaxComment/index.js"
import { optionsMatches } from "../../utils/optionsMatches/index.js"
import { rewriteInlineComments } from "../../utils/rewriteInlineComments/index.js"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `no-eol-whitespace`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	rejected: `Unexpected whitespace at end of line`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

let whitespacesToReject = new Set([` `, `\t`])

/**
 * Fixes whitespace at the end of a string.
 * @param {string} str - The string to fix.
 * @returns {string} The fixed string.
 */
function fixString (str) {
	return str.replace(/[ \t]+$/u, ``)
}

/**
 * Finds the start index of EOL whitespace error.
 * @param {number} lastEOLIndex - The last end-of-line index.
 * @param {string} string - The source code string.
 * @param {{ ignoreEmptyLines: boolean, isRootFirst: boolean }} options - The options object
 * @returns {number} The error start index, or -1 if no error.
 */
function findErrorStartIndex (lastEOLIndex, string, { ignoreEmptyLines, isRootFirst }) {
	let eolWhitespaceIndex = lastEOLIndex - 1

	// If the character before newline is not whitespace, ignore
	if (!whitespacesToReject.has(string.charAt(eolWhitespaceIndex))) return -1

	if (ignoreEmptyLines) {
		// If there is only whitespace between the previous newline and
		// this newline, ignore
		let beforeNewlineIndex = string.lastIndexOf(`\n`, eolWhitespaceIndex)

		if (beforeNewlineIndex >= 0 || isRootFirst) {
			let line = string.slice(Math.max(0, beforeNewlineIndex), eolWhitespaceIndex)

			if (isOnlyWhitespace(line)) return -1
		}
	}

	return eolWhitespaceIndex
}

/**
 * Disallows end-of-line whitespace.
 * @type {import('stylelint').Rule}
 */
function rule (primary, secondaryOptions) {
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
		 * Reports EOL whitespace violations from the specified index.
		 * @param {number} index - The index to report from.
		 */
		function reportFromIndex (index) {
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
		 * Iterate each whitespace at the end of each line of the given string.
		 * @param {string} string - the source code string.
		 * @param {(index: number) => void} callback - callback the whitespace index at the end of each line.
		 * @param {{ isRootFirst?: boolean, isPlainText?: boolean }} [options] - `isRootFirst` marks the given string as the first token of the root, `isPlainText` marks it as text that is not CSS.
		 * @returns {void}
		 */
		function eachEolWhitespace (string, callback, { isRootFirst = false, isPlainText = false } = {}) {
			/**
			 * Reports the whitespace, if any, at the found line ending.
			 * @param {number} startIndex - The index of the line ending.
			 */
			function handleEol (startIndex) {
				let index = findErrorStartIndex(startIndex, string, {
					ignoreEmptyLines,
					isRootFirst,
				})

				if (index > -1) callback(index)
			}

			// A CSS-aware scanner must not be used on text that is not CSS.
			// Without the surrounding comment delimiters,
			// an apostrophe in prose opens a string that is never closed,
			// and every line ending after it is skipped.
			if (isPlainText) {
				for (let { index } of string.matchAll(/[\n\r]/gu)) handleEol(index)

				return
			}

			styleSearch(
				{
					source: string,
					target: [`\n`, `\r`],
					comments: `check`,
				},
				(match) => {
					handleEol(match.startIndex)
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
					{ isRootFirst },
				)
				isRootFirst = false

				if (isAtRule(node)) {
					fixText(node.raws.afterName, (fixed) => {
						node.raws.afterName = fixed
					})

					fixText(getAtRuleParams(node), (fixed) => {
						setAtRuleParams(node, fixed)
					})
				}

				if (isRule(node)) {
					let rawsSelector = node.raws.selector

					// `postcss-scss` keeps two copies of a selector carrying an inline comment, and the whitespace this rule takes away may stand in the text of such a comment — `.a // c ` ends in a space the file holds and the raw hides two characters further along. The copy the file spells is the one that is printed, so the fix goes there, and the raw is refilled beside it the way the syntax fills it, comment by comment, for the rules that come after.
					if (rawsSelector && typeof rawsSelector.scss === `string`) {
						fixText(rawsSelector.scss, (fixed) => {
							rawsSelector.scss = fixed
							rawsSelector.raw = rewriteInlineComments(fixed, findInlineCommentSpans(fixed, true))
						})
					}
					else if (rawsSelector) {
						fixText(rawsSelector.raw, (fixed) => {
							rawsSelector.raw = fixed
						})
					}
					else {
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
					fixText(getDeclarationValue(node), (fixed) => {
						setDeclarationValue(node, fixed)
					})
				}

				if (isComment(node)) {
					fixText(node.raws.left, (fixed) => {
						node.raws.left = fixed
					})

					if (isStandardSyntaxComment(node)) {
						fixText(node.raws.right, (fixed) => {
							node.raws.right = fixed
						})
					}
					else node.raws.right = node.raws.right && fixString(node.raws.right)

					// The comment body is prose, not CSS: postcss has already stripped its delimiters.
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
				let lastEOL = Math.max(
					root.raws.after.lastIndexOf(`\n`),
					root.raws.after.lastIndexOf(`\r`),
				)

				if (lastEOL !== root.raws.after.length - 1) root.raws.after = root.raws.after.slice(0, lastEOL + 1) + fixString(root.raws.after.slice(lastEOL + 1))
			}
		}

		/**
		 * Fixes EOL whitespace in a text value.
		 * @param {string | undefined} value - The value to fix.
		 * @param {(text: string) => void} fixFn - The function to apply the fix.
		 * @param {{ isRootFirst?: boolean, isPlainText?: boolean }} [options] - The scanning options, forwarded to `eachEolWhitespace`.
		 */
		function fixText (value, fixFn, options) {
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

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
