import ruleMessages from "../../utils/ruleMessages.js"
import selectorCombinatorSpaceChecker from "../selectorCombinatorSpaceChecker.js"
import validateOptions from "../../utils/validateOptions.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

export const ruleName = `selector-combinator-space-after`

export const messages = ruleMessages(ruleName, {
	expectedAfter: (combinator) => `Expected single space after "${combinator}"`,
	rejectedAfter: (combinator) => `Unexpected whitespace after "${combinator}"`,
})

export const meta = {
	url: `https://github.com/firefoxic/stylelint-codeguide/blob/main/lib/rules/selector-combinator-space-after/README.md`,
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) {
			return
		}

		selectorCombinatorSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			locationType: `after`,
			checkedRuleName: ruleName,
			fix: context.fix ? (combinator) => {
				if (primary === `always`) {
					combinator.spaces.after = ` `

					return true
				}

				if (primary === `never`) {
					combinator.spaces.after = ``

					return true
				}

				return false
			} : null,
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
