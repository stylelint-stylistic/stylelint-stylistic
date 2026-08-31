import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { mediaQueryListCommaWhitespaceChecker } from "../../utils/mediaQueryListCommaWhitespaceChecker/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `media-query-list-comma-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/**
 * Requires a newline or disallows whitespace before the commas of media query lists.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `always-multi-line` and `never-multi-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-multi-line` | `never-multi-line`): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
