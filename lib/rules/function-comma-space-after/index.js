import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import fixer from "../../utils/functionCommaSpaceFix.js"
import functionCommaSpaceChecker from "../../utils/functionCommaSpaceChecker.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `function-comma-space-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ","`,
	rejectedAfter: () => `Unexpected whitespace after ","`,
	expectedAfterSingleLine: () => `Expected single space after "," in a single-line function`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "," in a single-line function`,
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
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) {
			return
		}

		functionCommaSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: (div, index, nodes) => fixer({
				div,
				index,
				nodes,
				expectation: primary,
				position: `after`,
				symb: ` `,
			}),
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
