import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { functionCommaSpaceChecker } from "../../utils/functionCommaSpaceChecker/index.ts"
import { functionCommaSpaceFix } from "../../utils/functionCommaSpaceFix/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `function-comma-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line function`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line function`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace before the commas of functions.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always`, `always-multi-line` or `never-multi-line`.
 * @param secondaryOptions - The secondary options: `ignoreFunctions`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-multi-line` | `never-multi-line`, secondaryOptions: { ignoreFunctions?: string | RegExp | (string | RegExp)[] }): RuleCheck {
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
				},
				optional: true,
			},
		)

		if (!validOptions) return

		functionCommaSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
			fixPosition: `before`,
			ignoreFunctions: secondaryOptions?.ignoreFunctions,
			fix: (div, index, functionNode) => functionCommaSpaceFix({
				div,
				index,
				functionNode,
				expectation: primary,
				position: `before`,
				symb: getLineBreak(syntax, root, result),
			}),
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
