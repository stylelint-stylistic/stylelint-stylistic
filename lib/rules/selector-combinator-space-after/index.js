import stylelint from "stylelint"

import selectorCombinatorSpaceChecker from "../../utils/selectorCombinatorSpaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `selector-combinator-space-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: (combinator) => `Expected single space after "${combinator}"`,
	rejectedAfter: (combinator) => `Unexpected whitespace after "${combinator}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
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
