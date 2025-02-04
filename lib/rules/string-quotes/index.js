import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import { isAtRule } from "../../utils/typeGuards.js"
import isStandardSyntaxRule from "../../utils/isStandardSyntaxRule.js"
import parseSelector from "../../utils/parseSelector.js"
import { assertString, isBoolean } from "../../utils/validateTypes.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `string-quotes`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (q) => `Expected ${q} quotes`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

let singleQuote = `'`
let doubleQuote = `"`

/** @type {import('stylelint').Rule} */
function rule (primary, secondaryOptions) {
	let correctQuote = primary === `single` ? singleQuote : doubleQuote
	let erroneousQuote = primary === `single` ? doubleQuote : singleQuote

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`single`, `double`],
			},
			{
				actual: secondaryOptions,
				possible: {
					avoidEscape: [isBoolean],
				},
				optional: true,
			},
		)

		if (!validOptions) {
			return
		}

		let avoidEscape = secondaryOptions && secondaryOptions.avoidEscape !== undefined ? secondaryOptions.avoidEscape : true

		root.walk((node) => {
			switch (node.type) {
				case `atrule`:
					checkDeclOrAtRule(node, node.params, atRuleParamIndex)
					break
				case `decl`:
					checkDeclOrAtRule(node, node.value, declarationValueIndex)
					break
				case `rule`:
					checkRule(node)
					break
			}
		})

		/**
		 * @param {import('postcss').Rule} ruleNode
		 * @returns {void}
		 */
		function checkRule (ruleNode) {
			if (!isStandardSyntaxRule(ruleNode)) {
				return
			}

			if (!ruleNode.selector.includes(`[`) || !ruleNode.selector.includes(`=`)) {
				return
			}

			/** @type {number[]} */
			let fixPositions = []

			parseSelector(ruleNode.selector, result, ruleNode, (selectorTree) => {
				let selectorFixed = false

				selectorTree.walkAttributes((attributeNode) => {
					if (!attributeNode.quoted) {
						return
					}

					const maybeProblemIndex = attributeNode.sourceIndex + attributeNode.offsetOf(`value`)

					if (attributeNode.quoteMark === correctQuote && avoidEscape) {
						assertString(attributeNode.value)

						let needsCorrectEscape = attributeNode.value.includes(correctQuote)
						let needsOtherEscape = attributeNode.value.includes(erroneousQuote)

						if (needsOtherEscape) {
							return
						}

						if (needsCorrectEscape) {
							report({
								message: messages.expected,
								messageArgs: [primary === `single` ? `double` : primary],
								node: ruleNode,
								index: maybeProblemIndex,
								endIndex: maybeProblemIndex,
								result,
								ruleName,
								fix () {
									selectorFixed = true
									attributeNode.quoteMark = erroneousQuote
								},
							})
						}
					}

					if (attributeNode.quoteMark === erroneousQuote) {
						if (avoidEscape) {
							assertString(attributeNode.value)

							let needsCorrectEscape = attributeNode.value.includes(correctQuote)
							let needsOtherEscape = attributeNode.value.includes(erroneousQuote)

							if (needsOtherEscape) {
								report({
									message: messages.expected,
									messageArgs: [primary],
									node: ruleNode,
									index: maybeProblemIndex,
									endIndex: maybeProblemIndex,
									result,
									ruleName,
									fix () {
										selectorFixed = true
										attributeNode.quoteMark = correctQuote
									},
								})

								return
							}

							if (needsCorrectEscape) {
								return
							}
						}

						report({
							message: messages.expected,
							messageArgs: [primary],
							node: ruleNode,
							index: maybeProblemIndex,
							endIndex: maybeProblemIndex,
							result,
							ruleName,
							fix () {
								selectorFixed = true
								attributeNode.quoteMark = correctQuote
							},
						})
					}
				})

				if (selectorFixed) {
					ruleNode.selector = selectorTree.toString()
				}
			})

			for (let fixIndex of fixPositions) {
				ruleNode.selector = replaceQuote(ruleNode.selector, fixIndex, correctQuote)
			}
		}

		/**
		 * @template {import('postcss').AtRule | import('postcss').Declaration} T
		 * @param {T} node
		 * @param {string} value
		 * @param {(node: T) => number} getIndex
		 * @returns {void}
		 */
		function checkDeclOrAtRule (node, value, getIndex) {
			/** @type {number[]} */
			let fixPositions = []

			// Get out quickly if there are no erroneous quotes
			if (!value.includes(erroneousQuote)) {
				return
			}

			if (isAtRule(node) && node.name === `charset`) {
				let hasValidQuotes = node.params.startsWith(`"`) && node.params.endsWith(`"`)

				// pass through to the fixer only if the primary option is "double"
				if (hasValidQuotes || correctQuote === `'`) { return }
			}

			valueParser(value).walk((valueNode) => {
				if (valueNode.type === `string` && valueNode.quote === erroneousQuote) {
					let needsEscape = valueNode.value.includes(correctQuote)

					if (avoidEscape && needsEscape) {
						// don't consider this an error
						return
					}

					const openIndex = valueNode.sourceIndex
					const problemIndex = getIndex(node) + openIndex

					report({
						message: messages.expected,
						messageArgs: [primary],
						node,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix () {
							// we currently don't fix escapes
							if (!needsEscape) {
								let closeIndex = openIndex + valueNode.value.length + erroneousQuote.length

								fixPositions.push(openIndex, closeIndex)
							}
						},
					})
				}
			})

			for (let fixIndex of fixPositions) {
				if (isAtRule(node)) {
					node.params = replaceQuote(node.params, fixIndex, correctQuote)
				} else {
					node.value = replaceQuote(node.value, fixIndex, correctQuote)
				}
			}
		}
	}
}

/**
 * @param {string} string
 * @param {number} index
 * @param {string} replace
 * @returns {string}
 */
function replaceQuote (string, index, replace) {
	return string.substring(0, index) + replace + string.substring(index + replace.length)
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
