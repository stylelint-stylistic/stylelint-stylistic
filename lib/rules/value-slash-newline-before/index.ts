import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { checkValueSlashes } from "../../utils/slashSpaceChecker/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `value-slash-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before "/"`,
	expectedBeforeMultiLine: () => `Expected newline before "/" in a multi-line declaration`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "/" in a multi-line declaration`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace before the solidus separating the parts of a value.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always`, `always-multi-line` or `never-multi-line`.
 * @param secondaryOptions - `ignoreFunctions` and `ignoreProperties`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-multi-line` | `never-multi-line`, secondaryOptions: { ignoreFunctions?: string | RegExp | (string | RegExp)[], ignoreProperties?: string | RegExp | (string | RegExp)[] }): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`always`, `always-multi-line`, `never-multi-line`],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignoreFunctions: [isString, isRegExp],
					ignoreProperties: [isString, isRegExp],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		checkValueSlashes({
			root,
			result,
			syntax,
			checkedRuleName: ruleName,
			locationChecker: checker.beforeAllowingIndentation,
			position: `before`,
			expectation: primary,
			whitespace: `newline`,
			ignoreFunctions: secondaryOptions?.ignoreFunctions,
			ignoreProperties: secondaryOptions?.ignoreProperties,
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
