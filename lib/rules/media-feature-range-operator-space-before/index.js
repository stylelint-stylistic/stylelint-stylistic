import stylelint from "stylelint"

import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import findMediaOperator from "../../utils/findMediaOperator.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `media-feature-range-operator-space-before`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before range operator`,
	rejectedBefore: () => `Unexpected whitespace before range operator`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
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
				checkBeforeOperator(match, params, node, fix)
			})

			if (fixOperatorIndices.length) {
				let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params

				for (const index of fixOperatorIndices.sort((a, b) => b - a)) {
					const beforeOperator = params.slice(0, index)
					const afterOperator = params.slice(index)

					if (primary === `always`) {
						params = beforeOperator.replace(/\s*$/, ` `) + afterOperator
					} else if (primary === `never`) {
						params = beforeOperator.replace(/\s*$/, ``) + afterOperator
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
		function checkBeforeOperator (match, params, node, fix) {
			// The extra `+ 1` is because the match itself contains
			// the character before the operator
			checker.before({
				source: params,
				index: match.startIndex,
				err: (m) => {
					if (fix) {
						fix(match.startIndex)

						return
					}

					report({
						message: m,
						node,
						index: match.startIndex - 1 + atRuleParamIndex(node),
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
