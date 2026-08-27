import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { FRACTION_WITH_LEADING_ZEROS, FRACTION_WITHOUT_LEADING_ZERO } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../../utils/endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpanHolding, findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.js"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { opensAnAddress } from "../../utils/opensAnAddress/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { isAtRule } from "../../utils/typeGuards/index.js"

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

/**
 * Requires or disallows a leading zero for fractional numbers less than 1.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		let fix = null

		root.walkAtRules((atRule) => {
			if (atRule.name.toLowerCase() === `import`) return

			check(atRule, getAtRuleParams(atRule))
		})

		root.walkDecls((decl) => check(decl, getDeclarationValue(decl)))

		/**
		 * Checks a node for leading zero violations.
		 * @param {import('postcss').AtRule | import('postcss').Declaration} node - The node to check.
		 * @param {string} value - The value to check.
		 */
		function check (node, value) {
			/** @type {Array<{ startIndex: number, endIndex: number }>} */
			let neverFixPositions = []

			/** @type {Array<{ index: number }>} */
			let alwaysFixPositions = []

			// Get out quickly if there are no periods
			if (!value.includes(`.`)) return

			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary words and calls
			let inlineComments = findInlineCommentSpans(value, endsInlineCommentOnFormFeed(node), readsInlineComments(node, result))

			valueParser(value).walk((valueNode, at, siblings) => {
				// A call opening an address holds a URL and no arguments of its own, so it is passed over whole. The name is read rather than matched against four characters, so that `u\rl(`, `\75 rl(` and `URL(` are the token `url(` is here as they are to the scan that finds the comments — and to Sass, and to `lightningcss`.
				if (opensAnAddress(valueNode, at, siblings)) return false

				// A node standing in the text of an inline comment is no node of the value: leave it alone. What it holds is still walked, and every node of that asked the same question, since a call opened inside such a comment reaches past the break that closes it and the code it gathers there is code the file spells. An address is passed over first, since the scan that finds the comments steps over one only where it reads it as code: an `url()` opened in a comment's text is a node of that comment holding an address that reaches past the break, and what stands there is nothing this rule may read.
				if (findInlineCommentSpanHolding(valueNode, inlineComments)) return

				// Ignore strings, comments, etc
				if (valueNode.type !== `word`) return

				// Check leading zero
				if (primary === `always`) {
					let match = FRACTION_WITHOUT_LEADING_ZERO.exec(valueNode.value)

					if (match === null || match[0] === null || match[1] === null) return

					// The match reaches back a character to make sure the dot opens a number, so it is one longer than the number itself wherever it did: subtracting the number's length gives the index the dot stands at, which is 1 for `-.5` and 0 for `.5`.
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
					let match = FRACTION_WITH_LEADING_ZEROS.exec(valueNode.value)

					if (match === null || match[0] === null || match[1] === null || match[2] === null) return

					// The match reaches back a character to make sure the zeros open a number, so subtracting the zeros and the fraction behind them from the whole gives the index the first zero stands at, which is 1 for `-00.5` and 0 for `00.5`.
					let capturingGroupIndex = match[0].length - (match[1].length + match[2].length)

					let index = valueNode.sourceIndex + match.index + capturingGroupIndex

					fix = () => {
						neverFixPositions.unshift({
							startIndex: index,
							// `match[1]` is the run of zeros itself, so its length is how far the fix reaches
							endIndex: index + match[1].length,
						})
					}

					let baseIndex = isAtRule(node) ? atRuleParamIndex(node) : declarationValueIndex(node)

					complain(messages.rejected, node, baseIndex + index)
				}
			})

			if (alwaysFixPositions.length > 0) {
				for (let fixPosition of alwaysFixPositions) {
					let index = fixPosition.index

					if (isAtRule(node)) setAtRuleParams(node, addLeadingZero(getAtRuleParams(node), index))
					else setDeclarationValue(node, addLeadingZero(getDeclarationValue(node), index))
				}
			}

			if (neverFixPositions.length > 0) {
				for (let fixPosition of neverFixPositions) {
					let startIndex = fixPosition.startIndex
					let endIndex = fixPosition.endIndex

					if (isAtRule(node)) setAtRuleParams(node, removeLeadingZeros(getAtRuleParams(node), startIndex, endIndex))
					else setDeclarationValue(node, removeLeadingZeros(getDeclarationValue(node), startIndex, endIndex))
				}
			}
		}

		/**
		 * Reports a leading zero violation.
		 * @param {string} message - The error message to report.
		 * @param {import('postcss').Node} node - The node with the violation.
		 * @param {number} index - The index of the violation.
		 * @returns {void}
		 */
		function complain (message, node, index) {
			report({
				result,
				ruleName,
				message,
				node,
				index,
				endIndex: index,
				fix,
			})
		}
	}
}

/**
 * Adds a leading zero to a number at the specified index.
 * @param {string} input - The input string.
 * @param {number} index - The index at which to add the leading zero.
 * @returns {string} The string with the leading zero added.
 */
function addLeadingZero (input, index) {
	return `${input.slice(0, index)}0${input.slice(index)}`
}

/**
 * Removes leading zeros from a number in the specified range.
 * @param {string} input - The input string.
 * @param {number} startIndex - The start index of the range to remove.
 * @param {number} endIndex - The end index of the range to remove.
 * @returns {string} The string with leading zeros removed.
 */
function removeLeadingZeros (input, startIndex, endIndex) {
	return input.slice(0, startIndex) + input.slice(endIndex)
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
