import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { atRuleNameSpaceChecker } from "../../utils/atRuleNameSpaceChecker.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker.js"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `at-rule-name-newline-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: (name) => `Expected newline after at-rule name "${name}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
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
