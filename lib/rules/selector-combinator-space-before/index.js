import ruleMessages from '../../utils/ruleMessages'
import selectorCombinatorSpaceChecker from '../selectorCombinatorSpaceChecker'
import validateOptions from '../../utils/validateOptions'
import whitespaceChecker from '../../utils/whitespaceChecker'

export const ruleName = `selector-combinator-space-before`

export const messages = ruleMessages(ruleName, {
	expectedBefore: (combinator) => `Expected single space before "${ combinator }"`,
	rejectedBefore: (combinator) => `Unexpected whitespace before "${ combinator }"`
})

export const meta = {
	url: `https://stylelint.io/user-guide/rules/selector-combinator-space-before`,
	fixable: true
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`]
		})

		if (!validOptions) {
			return
		}

		selectorCombinatorSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			locationType: `before`,
			checkedRuleName: ruleName,
			fix: context.fix
				? (combinator) => {
					if (primary === `always`) {
						combinator.spaces.before = ` `

						return true
					}

					if (primary === `never`) {
						combinator.spaces.before = ``

						return true
					}

					return false
				}
				: null
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
