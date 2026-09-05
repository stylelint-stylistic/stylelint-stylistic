import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { checkValueSlashes } from "../../utils/slashSpaceChecker/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `value-slash-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before "/"`,
	rejectedBefore: () => `Unexpected whitespace before "/"`,
	expectedBeforeSingleLine: () => `Expected single space before "/" in a single-line declaration`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "/" in a single-line declaration`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace before the solidus that separates the parts of a value.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line` and `never-single-line`.
 * @param secondaryOptions - The secondary options: `ignoreFunctions` and `ignoreProperties`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never` | `always-single-line` | `never-single-line`, secondaryOptions: { ignoreFunctions?: string | RegExp | (string | RegExp)[], ignoreProperties?: string | RegExp | (string | RegExp)[] }): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`always`, `never`, `always-single-line`, `never-single-line`],
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
			locationChecker: checker.before,
			position: `before`,
			expectation: primary,
			ignoreFunctions: secondaryOptions?.ignoreFunctions,
			ignoreProperties: secondaryOptions?.ignoreProperties,
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
