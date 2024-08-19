import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import { isAtRule } from "../../utils/typeGuards.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `number-leading-zero`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: `Expected a leading zero`,
	rejected: `Unexpected leading zero`,
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
			possible: [`always`, `never`],
		})

		if (!validOptions) {
			return
		}

		let fix = null

		root.walkAtRules((atRule) => {
			if (atRule.name.toLowerCase() === `import`) {
				return
			}

			check(atRule, atRule.params)
		})

		root.walkDecls((decl) => check(decl, decl.value))

		/**
		 * @param {import('postcss').AtRule | import('postcss').Declaration} node
		 * @param {string} value
		 */
		function check (node, value) {
			/** @type {Array<{ startIndex: number, endIndex: number }>} */
			let neverFixPositions = []

			/** @type {Array<{ index: number }>} */
			let alwaysFixPositions = []

			// Get out quickly if there are no periods
			if (!value.includes(`.`)) {
				return
			}

			valueParser(value).walk((valueNode) => {
				// Ignore `url` function
				if (valueNode.type === `function` && valueNode.value.toLowerCase() === `url`) {
					return false
				}

				// Ignore strings, comments, etc
				if (valueNode.type !== `word`) {
					return
				}

				// Check leading zero
				if (primary === `always`) {
					let match = (/(?:\D|^)(\.\d+)/).exec(valueNode.value)

					if (match === null || match[0] === null || match[1] === null) {
						return
					}

					// The regexp above consists of 2 capturing groups (or capturing parentheses).
					// We need the index of the second group. This makes sanse when we have "-.5" as an input
					// for regex. And we need the index of ".5".
					let capturingGroupIndex = match[0].length - match[1].length

					let index = valueNode.sourceIndex + match.index + capturingGroupIndex

					fix = () => {
						alwaysFixPositions.unshift({
							index,
						})
					}

					let baseIndex = isAtRule(node) ? atRuleParamIndex(node) : declarationValueIndex(node)

					complain(messages.expected, node, baseIndex + index)
				}

				if (primary === `never`) {
					let match = (/(?:\D|^)(0+)(\.\d+)/).exec(valueNode.value)

					if (match === null || match[0] === null || match[1] === null || match[2] === null) {
						return
					}

					// The regexp above consists of 3 capturing groups (or capturing parentheses).
					// We need the index of the second group. This makes sanse when we have "-00.5"
					// as an input for regex. And we need the index of "00".
					let capturingGroupIndex = match[0].length - (match[1].length + match[2].length)

					let index = valueNode.sourceIndex + match.index + capturingGroupIndex

					fix = () => {
						neverFixPositions.unshift({
							startIndex: index,
							// match[1].length is the length of our matched zero(s)
							endIndex: index + match[1].length,
						})
					}

					let baseIndex = isAtRule(node) ? atRuleParamIndex(node) : declarationValueIndex(node)

					complain(messages.rejected, node, baseIndex + index)
				}
			})

			if (alwaysFixPositions.length) {
				for (let fixPosition of alwaysFixPositions) {
					let index = fixPosition.index

					if (isAtRule(node)) {
						node.params = addLeadingZero(node.params, index)
					} else {
						node.value = addLeadingZero(node.value, index)
					}
				}
			}

			if (neverFixPositions.length) {
				for (let fixPosition of neverFixPositions) {
					let startIndex = fixPosition.startIndex
					let endIndex = fixPosition.endIndex

					if (isAtRule(node)) {
						node.params = removeLeadingZeros(node.params, startIndex, endIndex)
					} else {
						node.value = removeLeadingZeros(node.value, startIndex, endIndex)
					}
				}
			}
		}

		/**
		 * @param {string} message
		 * @param {import('postcss').Node} node
		 * @param {number} index
		 */
		function complain (message, node, index) {
			report({
				result,
				ruleName,
				message,
				node,
				index,
				fix,
			})
		}
	}
}

/**
 * @param {string} input
 * @param {number} index
 * @returns {string}
 */
function addLeadingZero (input, index) {
	return `${input.slice(0, index)}0${input.slice(index)}`
}

/**
 * @param {string} input
 * @param {number} startIndex
 * @param {number} endIndex
 * @returns {string}
 */
function removeLeadingZeros (input, startIndex, endIndex) {
	return input.slice(0, startIndex) + input.slice(endIndex)
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
