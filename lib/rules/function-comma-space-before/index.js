import fixer from '../functionCommaSpaceFix'
import functionCommaSpaceChecker from '../functionCommaSpaceChecker'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'
import whitespaceChecker from '../../utils/whitespaceChecker'

export const ruleName = `function-comma-space-before`

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ","`,
	rejectedBefore: () => `Unexpected whitespace before ","`,
	expectedBeforeSingleLine: () => `Expected single space before "," in a single-line function`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "," in a single-line function`
})

export const meta = {
	url: `https://stylelint.io/user-guide/rules/function-comma-space-before`,
	fixable: true
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`]
		})

		if (!validOptions) {
			return
		}

		functionCommaSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			fix: context.fix
				? (div, index, nodes) =>
					fixer({
						div,
						index,
						nodes,
						expectation: primary,
						position: `before`,
						symb: ` `
					})
				: null
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
