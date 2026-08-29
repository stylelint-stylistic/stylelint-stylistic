import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isStandardSyntaxAtRule } from "../../utils/isStandardSyntaxAtRule/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `at-rule-semicolon-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ";"`,
	rejectedBefore: () => `Unexpected whitespace before ";"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/**
 * Requires or disallows whitespace before the semicolons of at-rules.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkAtRules((atRule) => {
			if (hasBlock(atRule)) return

			if (!isStandardSyntaxAtRule(atRule)) return

			let atRuleString = rawNodeString(atRule, result)
			let problemIndex = atRuleString.length - 1

			checker.before({
				source: atRuleString,
				index: atRuleString.length,
				err: (m) => {
					report({
						message: m,
						node: atRule,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
					})
				},
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
