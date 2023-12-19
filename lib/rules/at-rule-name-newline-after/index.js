import stylelint from "stylelint"

import atRuleNameSpaceChecker from "../../utils/atRuleNameSpaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `at-rule-name-newline-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: (name) => `Expected newline after at-rule name "${name}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
}

/** @type {import('stylelint').Rule} */
const rule = (primary) => {
	const checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`],
		})

		if (!validOptions) {
			return
		}

		atRuleNameSpaceChecker({
			root,
			result,
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName,
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
