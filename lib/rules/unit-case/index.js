import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDimension from "../../utils/getDimension.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `unit-case`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) {
			return
		}

		/**
		 * @template {import('postcss').AtRule | import('postcss').Declaration} T
		 * @param {T} node
		 * @param {string} checkedValue
		 * @param {(node: T) => number} getIndex
		 * @returns {void}
		 */
		function check (node, checkedValue, getIndex) {
			/** @type {Array<{ index: number, endIndex: number, message: string }>} */
			const problems = []

			/**
			 * @param {import('postcss-value-parser').Node} valueNode
			 * @returns {boolean}
			 */
			function processValue (valueNode) {
				const { number, unit } = getDimension(valueNode)

				if (!number || !unit) { return false }

				const expectedUnit = primary === `lower` ? unit.toLowerCase() : unit.toUpperCase()

				if (unit === expectedUnit) {
					return false
				}

				const index = getIndex(node)

				problems.push({
					index: index + valueNode.sourceIndex + number.length,
					endIndex: index + valueNode.sourceEndIndex,
					message: messages.expected(unit, expectedUnit),
				})

				return true
			}

			const parsedValue = valueParser(checkedValue).walk((valueNode) => {
				// Ignore wrong units within `url` function
				const value = valueNode.value

				if (valueNode.type === `function` && value.toLowerCase() === `url`) {
					return false
				}

				if (value.includes(`*`)) {
					value.split(`*`).some((val) => processValue({
						...valueNode,
						sourceIndex: value.indexOf(val) + val.length + 1,
						value: val,
					}))
				}

				if (processValue(valueNode)) {
					valueNode.value = primary === `lower` ? value.toLowerCase() : value.toUpperCase()
				}
			})

			if (problems.length) {
				for (const err of problems) {
					report({
						index: err.index,
						endIndex: err.endIndex,
						message: err.message,
						node,
						result,
						ruleName,
						fix () {
							if (`name` in node && node.name === `media`) {
								node.params = parsedValue.toString()
							} else if (`value` in node) {
								node.value = parsedValue.toString()
							}
						},
					})
				}
			}
		}

		root.walkAtRules((atRule) => {
			if (!(/^media$/i).test(atRule.name) && !(`variable` in atRule)) {
				return
			}

			check(atRule, atRule.params, atRuleParamIndex)
		})
		root.walkDecls((decl) => check(decl, decl.value, declarationValueIndex))
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
