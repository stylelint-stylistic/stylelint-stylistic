import stylelint from "stylelint"

import atRuleNameSpaceChecker from "../../utils/atRuleNameSpaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `at-rule-name-space-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: (name) => `Expected single space after at-rule name "${name}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondary, context) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-single-line`],
		})

		if (!validOptions) {
			return
		}

		atRuleNameSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: context.fix ? (atRule) => {
				if (typeof atRule.raws.afterName === `string`) {
					atRule.raws.afterName = atRule.raws.afterName.replace(/^\s*/, ` `)
				}
			} : null,
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
