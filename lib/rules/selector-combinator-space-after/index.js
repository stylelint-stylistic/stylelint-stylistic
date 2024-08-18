import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import selectorCombinatorSpaceChecker from "../../utils/selectorCombinatorSpaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

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
function rule (primary) {
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
			fix: (combinator) => {
				if (primary === `always`) {
					combinator.spaces.after = ` `

					return true
				}

				if (primary === `never`) {
					combinator.spaces.after = ``

					return true
				}

				return false
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
