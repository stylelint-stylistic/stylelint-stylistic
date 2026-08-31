import stylelint from "stylelint"

import { LEADING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorAttributeOperatorSpaceChecker } from "../../utils/selectorAttributeOperatorSpaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-attribute-operator-space-after`

const MESSAGES = defineMessages({
	expectedAfter: (operator) => `Expected single space after "${operator}"`,
	rejectedAfter: (operator) => `Unexpected whitespace after "${operator}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace after operators within attribute selectors.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
	return (root, result) => {
		let checker = whitespaceChecker(`space`, primary, messages)
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		selectorAttributeOperatorSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			checkBeforeOperator: false,
			fix: (attributeNode) => {
				let { operatorAfter, setOperatorAfter }: {
					operatorAfter: string,
					setOperatorAfter: (fixed: string) => void,
				} = (() => {
					let rawOperator = attributeNode.raws.operator

					if (rawOperator) {
						return {
							operatorAfter: rawOperator.slice(
								attributeNode.operator ? attributeNode.operator.length : 0,
							),
							setOperatorAfter (fixed) {
								delete attributeNode.raws.operator

								if (!attributeNode.raws.spaces) attributeNode.raws.spaces = {}

								if (!attributeNode.raws.spaces.operator) attributeNode.raws.spaces.operator = {}

								attributeNode.raws.spaces.operator.after = fixed
							},
						}
					}

					let rawSpacesOperator = attributeNode.raws.spaces && attributeNode.raws.spaces.operator
					let rawOperatorAfter = rawSpacesOperator && rawSpacesOperator.after

					if (rawSpacesOperator && rawOperatorAfter) {
						return {
							operatorAfter: rawOperatorAfter,
							setOperatorAfter (fixed) {
								rawSpacesOperator.after = fixed
							},
						}
					}

					return {
						operatorAfter: (attributeNode.spaces.operator && attributeNode.spaces.operator.after) || ``,
						setOperatorAfter (fixed) {
							if (!attributeNode.spaces.operator) attributeNode.spaces.operator = {}

							attributeNode.spaces.operator.after = fixed
						},
					}
				})()

				if (primary === `always`) {
					setOperatorAfter(operatorAfter.replace(LEADING_WHITESPACE, ` `))

					return true
				}

				if (primary === `never`) {
					setOperatorAfter(operatorAfter.replace(LEADING_WHITESPACE, ``))

					return true
				}

				return false
			},
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
