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

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `string-quotes`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: (q) => `Expected ${q} quotes`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

const singleQuote = `'`
const doubleQuote = `"`

/** @type {import('stylelint').Rule} */
function rule (primary, secondaryOptions) {
	const correctQuote = primary === `single` ? singleQuote : doubleQuote
	const erroneousQuote = primary === `single` ? doubleQuote : singleQuote

	return (root, result) => {
		const validOptions = validateOptions(
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

		const avoidEscape = secondaryOptions && secondaryOptions.avoidEscape !== undefined ? secondaryOptions.avoidEscape : true

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
			const fixPositions = []

			parseSelector(ruleNode.selector, result, ruleNode, (selectorTree) => {
				let selectorFixed = false

				selectorTree.walkAttributes((attributeNode) => {
					if (!attributeNode.quoted) {
						return
					}

					if (attributeNode.quoteMark === correctQuote && avoidEscape) {
						assertString(attributeNode.value)

						const needsCorrectEscape = attributeNode.value.includes(correctQuote)
						const needsOtherEscape = attributeNode.value.includes(erroneousQuote)

						if (needsOtherEscape) {
							return
						}

						if (needsCorrectEscape) {
							report({
								message: messages.expected(primary === `single` ? `double` : primary),
								node: ruleNode,
								index: attributeNode.sourceIndex + attributeNode.offsetOf(`value`),
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

							const needsCorrectEscape = attributeNode.value.includes(correctQuote)
							const needsOtherEscape = attributeNode.value.includes(erroneousQuote)

							if (needsOtherEscape) {
								report({
									message: messages.expected(primary),
									node: ruleNode,
									index: attributeNode.sourceIndex + attributeNode.offsetOf(`value`),
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
							message: messages.expected(primary),
							node: ruleNode,
							index: attributeNode.sourceIndex + attributeNode.offsetOf(`value`),
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

			for (const fixIndex of fixPositions) {
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
			const fixPositions = []

			// Get out quickly if there are no erroneous quotes
			if (!value.includes(erroneousQuote)) {
				return
			}

			if (isAtRule(node) && node.name === `charset`) {
				const hasValidQuotes = node.params.startsWith(`"`) && node.params.endsWith(`"`)

				// pass through to the fixer only if the primary option is "double"
				if (hasValidQuotes || correctQuote === `'`) { return }
			}

			valueParser(value).walk((valueNode) => {
				if (valueNode.type === `string` && valueNode.quote === erroneousQuote) {
					const needsEscape = valueNode.value.includes(correctQuote)

					if (avoidEscape && needsEscape) {
						// don't consider this an error
						return
					}

					const openIndex = valueNode.sourceIndex

					report({
						message: messages.expected(primary),
						node,
						index: getIndex(node) + openIndex,
						result,
						ruleName,
						fix () {
							// we currently don't fix escapes
							if (!needsEscape) {
								const closeIndex = openIndex + valueNode.value.length + erroneousQuote.length

								fixPositions.push(openIndex, closeIndex)
							}
						},
					})
				}
			})

			for (const fixIndex of fixPositions) {
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
