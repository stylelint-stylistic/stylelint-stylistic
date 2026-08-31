import stylelint from "stylelint"

import { MEDIA_AT_RULE, TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findMediaOperator } from "../../utils/findMediaOperator/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `media-feature-range-operator-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before range operator`,
	rejectedBefore: () => `Unexpected whitespace before range operator`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace before the range operator in media features.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
			let fixOperatorIndices: number[] = []

			findMediaOperator(syntax, atRule, result, (match, params, node) => {
				let problemIndex = match.startIndex - 1 + atRuleParamIndex(node)

				// The extra `+ 1` is because the match itself contains the character before the operator
				checker.before({
					source: params,
					index: match.startIndex,
					err: (message) => {
						report({
							message,
							node,
							index: problemIndex,
							endIndex: problemIndex,
							result,
							ruleName,
							fix () {
								fixOperatorIndices.push(match.startIndex)
							},
						})
					},
				})
			})

			if (fixOperatorIndices.length > 0) {
				let params = syntax.read(atRule)

				for (let index of fixOperatorIndices.toSorted((a, b) => b - a)) {
					let beforeOperator = params.slice(0, index)
					let afterOperator = params.slice(index)

					if (primary === `always`) params = beforeOperator.replace(TRAILING_WHITESPACE, ` `) + afterOperator
					else if (primary === `never`) params = beforeOperator.replace(TRAILING_WHITESPACE, ``) + afterOperator
				}

				syntax.write(atRule, params)
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
