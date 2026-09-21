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

let shortName = `function-comma-space-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected single space after ","`,
	rejectedAfter: () => `Unexpected whitespace after ","`,
	expectedAfterSingleLine: () => `Expected single space after "," in a single-line function`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "," in a single-line function`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space after the commas, `never` no whitespace; the `-single-line` forms in a single-line function only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/** The secondary options. */
export type SecondaryOptions = {

	/** Functions whose commas are passed over, nested functions included, by name or pattern. */
	ignoreFunctions?: string | RegExp | (string | RegExp)[],
}

/**
 * Requires a single space or disallows whitespace after the commas of functions.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
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
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fixPosition: `after`,
			ignoreFunctions: secondaryOptions?.ignoreFunctions,
			fix: (div, index, functionNode) => functionCommaSpaceFix({
				div,
				index,
				functionNode,
				expectation: primary,
				position: `after`,
				symb: ` `,
			}),
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
