import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import { isNumber } from "../../utils/validateTypes.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `selector-max-empty-lines`

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

		root.walkRules((ruleNode) => {
			const selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector

			if (violatedLFNewLinesRegex.test(selector) || violatedCRLFNewLinesRegex.test(selector)) {
				report({
					message: messages.expected(primary),
					node: ruleNode,
					index: 0,
					result,
					ruleName,
					fix () {
						const newSelectorString = selector
							.replace(new RegExp(violatedLFNewLinesRegex, `gm`), allowedLFNewLinesString)
							.replace(new RegExp(violatedCRLFNewLinesRegex, `gm`), allowedCRLFNewLinesString)

						if (ruleNode.raws.selector) {
							ruleNode.raws.selector.raw = newSelectorString
						} else {
							ruleNode.selector = newSelectorString
						}
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
