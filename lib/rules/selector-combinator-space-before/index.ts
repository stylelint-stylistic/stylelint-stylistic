import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorCombinatorSpaceChecker } from "../../utils/selectorCombinatorSpaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-combinator-space-before`

const MESSAGES = defineMessages({
	expectedBefore: (combinator) => `Expected single space before "${combinator}"`,
	rejectedBefore: (combinator) => `Unexpected whitespace before "${combinator}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or no whitespace before selector combinators.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always` or `never`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		selectorCombinatorSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			locationType: `before`,
			checkedRuleName: ruleName,
			fix: (combinator) => {
				if (primary === `always`) {
					combinator.spaces.before = ` `

					return true
				}

				if (primary === `never`) {
					combinator.spaces.before = ``

					return true
				}

				return false
			},
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
