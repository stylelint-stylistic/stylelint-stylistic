import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { functionCommaSpaceChecker } from "../../utils/functionCommaSpaceChecker/index.ts"
import { functionCommaSpaceFix } from "../../utils/functionCommaSpaceFix/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `function-comma-newline-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after ","`,
	expectedAfterMultiLine: () => `Expected newline after "," in a multi-line function`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "," in a multi-line function`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace after the commas of functions.
 * @param primary - The primary option, one of `always`, `always-multi-line` and `never-multi-line`.
 * @param secondaryOptions - The secondary options: `ignoreFunctions`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `always-multi-line` | `never-multi-line`, secondaryOptions: { ignoreFunctions?: string | RegExp | (string | RegExp)[] }): RuleCheck {
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
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName,
			fixPosition: `after`,
			ignoreFunctions: secondaryOptions?.ignoreFunctions,
			fix: (div, index, functionNode) => functionCommaSpaceFix({
				div,
				index,
				functionNode,
				expectation: primary,
				position: `after`,
				symb: getLineBreak(root, result),
			}),
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
