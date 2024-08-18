import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import { isNumber } from "../../utils/validateTypes.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `value-list-max-empty-lines`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? `line` : `lines`}`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	const maxAdjacentNewlines = primary + 1

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: isNumber,
		})

		if (!validOptions) {
			return
		}

		const violatedCRLFNewLinesRegex = new RegExp(`(?:\r\n){${maxAdjacentNewlines + 1},}`)
		const violatedLFNewLinesRegex = new RegExp(`\n{${maxAdjacentNewlines + 1},}`)
		const allowedLFNewLinesString = `\n`.repeat(maxAdjacentNewlines)
		const allowedCRLFNewLinesString = `\r\n`.repeat(maxAdjacentNewlines)

		root.walkDecls((decl) => {
			const value = getDeclarationValue(decl)

			if (violatedLFNewLinesRegex.test(value) || violatedCRLFNewLinesRegex.test(value)) {
				report({
					message: messages.expected(primary),
					node: decl,
					index: 0,
					result,
					ruleName,
					fix () {
						const newValueString = value
							.replace(new RegExp(violatedLFNewLinesRegex, `gm`), allowedLFNewLinesString)
							.replace(new RegExp(violatedCRLFNewLinesRegex, `gm`), allowedCRLFNewLinesString)

						setDeclarationValue(decl, newValueString)
					},
				})
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
