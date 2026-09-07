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

/** `always` a single space before the solidus, `never` no whitespace; the `-single-line` forms in a single-line declaration only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/** The secondary options. */
export type SecondaryOptions = {

	/** Functions whose solidi are passed over, nested functions included, by name or pattern. */
	ignoreFunctions?: string | RegExp | (string | RegExp)[],

	/** Properties whose solidi are passed over, by name or pattern. */
	ignoreProperties?: string | RegExp | (string | RegExp)[],
}

/**
 * Requires a single space or disallows whitespace before a value's separator solidus.
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
			whitespace: `space`,
			ignoreFunctions: secondaryOptions?.ignoreFunctions,
			ignoreProperties: secondaryOptions?.ignoreProperties,
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
