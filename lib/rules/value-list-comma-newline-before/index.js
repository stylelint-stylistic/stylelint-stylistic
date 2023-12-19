import stylelint from "stylelint"

import valueListCommaWhitespaceChecker from "../../utils/valueListCommaWhitespaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `value-list-comma-newline-before`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`,
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
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) {
			return
		}

		valueListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
