import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDimension from "../../utils/getDimension.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `unit-case`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
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
			let problems = []

			/**
			 * @param {import('postcss-value-parser').Node} valueNode
			 * @returns {boolean}
			 */
			function processValue (valueNode) {
				let { number, unit } = getDimension(valueNode)

				if (!number || !unit) { return false }

				let expectedUnit = primary === `lower` ? unit.toLowerCase() : unit.toUpperCase()

				if (unit === expectedUnit) {
					return false
				}

				let index = getIndex(node)

				problems.push({
					index: index + valueNode.sourceIndex + number.length,
					endIndex: index + valueNode.sourceEndIndex,
					message: messages.expected,
					messageArgs: [unit, expectedUnit],
				})

				return true
			}

			let parsedValue = valueParser(checkedValue).walk((valueNode) => {
				// Ignore wrong units within `url` function
				let value = valueNode.value

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
				for (let err of problems) {
					report({
						index: err.index,
						endIndex: err.endIndex,
						message: err.message,
						messageArgs: err.messageArgs,
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
