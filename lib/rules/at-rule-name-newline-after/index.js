import atRuleNameSpaceChecker from '../atRuleNameSpaceChecker'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'
import whitespaceChecker from '../../utils/whitespaceChecker'

export const ruleName = `at-rule-name-newline-after`

export const messages = ruleMessages(ruleName, {
	expectedAfter: (name) => `Expected newline after at-rule name "${ name }"`
})

export const meta = {
	url: `https://github.com/firefoxic/stylelint-codeguide/blob/main/lib/rules/at-rule-name-newline-after/README.md`
}

/** @type {import('stylelint').Rule} */
const rule = (primary) => {
	const checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`]
		})

		if (!validOptions) {
			return
		}

		atRuleNameSpaceChecker({
			root,
			result,
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
