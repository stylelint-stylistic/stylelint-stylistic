import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'
import valueListCommaWhitespaceChecker from '../valueListCommaWhitespaceChecker'
import whitespaceChecker from '../../utils/whitespaceChecker'

export const ruleName = `value-list-comma-newline-before`

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`
})

export const meta = {
	url: `https://stylelint.io/user-guide/rules/value-list-comma-newline-before`
}

/** @type {import('stylelint').Rule} */
const rule = (primary) => {
	const checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`]
		})

		if (!validOptions) {
			return
		}

		valueListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
