import stylelint from "stylelint"

import { LEADING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleNameSpaceChecker } from "../../utils/atRuleNameSpaceChecker/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `at-rule-name-space-after`

const MESSAGES = defineMessages({
	expectedAfter: (name) => `Expected single space after at-rule name "${name}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space after at-rule names.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `always-single-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-single-line`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-single-line`],
		})

		if (!validOptions) return

		atRuleNameSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: (atRule) => {
				if (typeof atRule.raws.afterName === `string`) atRule.raws.afterName = atRule.raws.afterName.replace(LEADING_WHITESPACE, ` `)
			},
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
