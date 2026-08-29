import stylelint from "stylelint"

import { LEADING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { atRuleNameSpaceChecker } from "../../utils/atRuleNameSpaceChecker/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `at-rule-name-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: (name) => `Expected single space after at-rule name "${name}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space after at-rule names.
 * @param primary - The primary option, one of `always` and `always-single-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `always-single-line`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-single-line`],
		})

		if (!validOptions) return

		atRuleNameSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: (atRule) => {
				if (typeof atRule.raws.afterName === `string`) atRule.raws.afterName = atRule.raws.afterName.replace(LEADING_WHITESPACE, ` `)
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
