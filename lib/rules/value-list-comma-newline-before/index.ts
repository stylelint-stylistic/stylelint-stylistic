import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { valueListCommaWhitespaceChecker } from "../../utils/valueListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `value-list-comma-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/** `always` a newline before the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line value list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace before the commas of value lists.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		valueListCommaWhitespaceChecker({
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
