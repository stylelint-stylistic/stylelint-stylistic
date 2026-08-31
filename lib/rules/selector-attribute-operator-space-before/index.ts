import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorAttributeOperatorSpaceChecker } from "../../utils/selectorAttributeOperatorSpaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-attribute-operator-space-before`

const MESSAGES = defineMessages({
	expectedBefore: (operator) => `Expected single space before "${operator}"`,
	rejectedBefore: (operator) => `Unexpected whitespace before "${operator}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace before operators within attribute selectors.
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

		selectorAttributeOperatorSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			checkBeforeOperator: true,
			fix: (attributeNode) => {
				let rawAttr = attributeNode.raws.spaces && attributeNode.raws.spaces.attribute
				let rawAttrAfter = rawAttr && rawAttr.after

				let { attrAfter, setAttrAfter }: {
					attrAfter: string,
					setAttrAfter: (fixed: string) => void,
				} = rawAttr && rawAttrAfter
					? {
						attrAfter: rawAttrAfter,
						setAttrAfter (fixed) {
							rawAttr.after = fixed
						},
					}
					: {
						attrAfter: (attributeNode.spaces.attribute && attributeNode.spaces.attribute.after) || ``,
						setAttrAfter (fixed) {
							if (!attributeNode.spaces.attribute) attributeNode.spaces.attribute = {}

							attributeNode.spaces.attribute.after = fixed
						},
					}

				if (primary === `always`) {
					setAttrAfter(attrAfter.replace(TRAILING_WHITESPACE, ` `))

					return true
				}

				if (primary === `never`) {
					setAttrAfter(attrAfter.replace(TRAILING_WHITESPACE, ``))

					return true
				}

				return false
			},
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
