import stylelint from "stylelint"

import { LEADING_WHITESPACE, MEDIA_AT_RULE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findMediaOperator } from "../../utils/findMediaOperator/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `media-feature-range-operator-space-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected single space after range operator`,
	rejectedAfter: () => `Unexpected whitespace after range operator`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace after the range operator in media features.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
			let fixOperatorIndices: number[] = []

			findMediaOperator(atRule, result, (match, params, node) => {
				let endIndex = match.startIndex + match.target.length - 1
				let problemIndex = endIndex + atRuleParamIndex(node) + 1

				checker.after({
					source: params,
					index: endIndex,
					err: (message) => {
						report({
							message,
							node,
							index: problemIndex,
							endIndex: problemIndex,
							result,
							ruleName,
							fix () {
								fixOperatorIndices.push(endIndex)
							},
						})
					},
				})
			})

			if (fixOperatorIndices.length > 0) {
				let params = getAtRuleParams(atRule)

				for (let index of fixOperatorIndices.toSorted((a, b) => b - a)) {
					let beforeOperator = params.slice(0, index + 1)
					let afterOperator = params.slice(index + 1)

					if (primary === `always`) params = beforeOperator + afterOperator.replace(LEADING_WHITESPACE, ` `)
					else if (primary === `never`) params = beforeOperator + afterOperator.replace(LEADING_WHITESPACE, ``)
				}

				setAtRuleParams(atRule, params)
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
