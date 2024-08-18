import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import findMediaOperator from "../../utils/findMediaOperator.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

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
function rule (primary) {
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

			findMediaOperator(atRule, (match, params, node) => {
				// The extra `+ 1` is because the match itself contains the character before the operator
				checker.before({
					source: params,
					index: match.startIndex,
					err: (m) => {
						report({
							message: m,
							node,
							index: match.startIndex - 1 + atRuleParamIndex(node),
							result,
							ruleName,
							fix () {
								fixOperatorIndices.push(match.startIndex)
							},
						})
					},
				})
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
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
