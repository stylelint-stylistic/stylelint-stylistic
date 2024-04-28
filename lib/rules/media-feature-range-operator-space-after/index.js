import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import findMediaOperator from "../../utils/findMediaOperator.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `media-feature-range-operator-space-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after range operator`,
	rejectedAfter: () => `Unexpected whitespace after range operator`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary, _secondaryOptions, context) {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) {
			return
		}

		root.walkAtRules(/^media$/i, (atRule) => {
			/** @type {number[]} */
			const fixOperatorIndices = []

			/** @type {((index: number) => void) | null} */
			const fix = context.fix ? (index) => fixOperatorIndices.push(index) : null

			findMediaOperator(atRule, (match, params, node) => {
				checkAfterOperator(match, params, node, fix)
			})

			if (fixOperatorIndices.length) {
				let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params

				for (const index of fixOperatorIndices.sort((a, b) => b - a)) {
					const beforeOperator = params.slice(0, index + 1)
					const afterOperator = params.slice(index + 1)

					if (primary === `always`) {
						params = beforeOperator + afterOperator.replace(/^\s*/, ` `)
					} else if (primary === `never`) {
						params = beforeOperator + afterOperator.replace(/^\s*/, ``)
					}
				}

				if (atRule.raws.params) {
					atRule.raws.params.raw = params
				} else {
					atRule.params = params
				}
			}
		})

		/**
		 * @param {import('style-search').StyleSearchMatch} match
		 * @param {string} params
		 * @param {import('postcss').AtRule} node
		 * @param {((index: number) => void) | null} fix
		 */
		function checkAfterOperator (match, params, node, fix) {
			const endIndex = match.startIndex + match.target.length - 1

			checker.after({
				source: params,
				index: endIndex,
				err: (m) => {
					if (fix) {
						fix(endIndex)

						return
					}

					report({
						message: m,
						node,
						index: endIndex + atRuleParamIndex(node) + 1,
						result,
						ruleName,
					})
				},
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
