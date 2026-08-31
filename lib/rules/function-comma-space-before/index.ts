import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { functionCommaSpaceChecker } from "../../utils/functionCommaSpaceChecker/index.ts"
import { functionCommaSpaceFix } from "../../utils/functionCommaSpaceFix/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `function-comma-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before ","`,
	rejectedBefore: () => `Unexpected whitespace before ","`,
	expectedBeforeSingleLine: () => `Expected single space before "," in a single-line function`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "," in a single-line function`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace before the commas of functions.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line` and `never-single-line`.
 * @param secondaryOptions - The secondary options: `ignoreFunctions`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never` | `always-single-line` | `never-single-line`, secondaryOptions: { ignoreFunctions?: string | RegExp | (string | RegExp)[] }): RuleCheck {
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
				},
				optional: true,
			},
		)

		if (!validOptions) return

		functionCommaSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			fixPosition: `before`,
			ignoreFunctions: secondaryOptions?.ignoreFunctions,
			fix: (div, index, functionNode) => functionCommaSpaceFix({
				div,
				index,
				functionNode,
				expectation: primary,
				position: `before`,
				symb: ` `,
			}),
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
