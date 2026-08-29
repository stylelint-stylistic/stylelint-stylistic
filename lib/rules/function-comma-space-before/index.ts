import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { functionCommaSpaceChecker } from "../../utils/functionCommaSpaceChecker/index.ts"
import { functionCommaSpaceFix } from "../../utils/functionCommaSpaceFix/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `function-comma-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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
 * @param primary - The primary option, one of `always`, `never`, `always-single-line` and `never-single-line`.
 * @param secondaryOptions - The secondary options: `ignoreFunctions`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never` | `always-single-line` | `never-single-line`, secondaryOptions: { ignoreFunctions?: string | RegExp | (string | RegExp)[] }): RuleCheck {
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

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
