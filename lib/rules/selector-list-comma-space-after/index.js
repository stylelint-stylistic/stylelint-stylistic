import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import selectorListCommaWhitespaceChecker from "../../utils/selectorListCommaWhitespaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `selector-list-comma-space-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ","`,
	rejectedAfter: () => `Unexpected whitespace after ","`,
	expectedAfterSingleLine: () => `Expected single space after "," in a single-line list`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "," in a single-line list`,
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

		/** @type {Map<import('postcss').Rule, number[]> | undefined} */
		let fixData

		selectorListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: (ruleNode, index) => {
				fixData = fixData || (new Map)

				const commaIndices = fixData.get(ruleNode) || []

				commaIndices.push(index)
				fixData.set(ruleNode, commaIndices)

				return true
			},
		})

		if (fixData) {
			for (const [ruleNode, commaIndices] of fixData.entries()) {
				let selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector

				for (const index of commaIndices.sort((a, b) => b - a)) {
					const beforeSelector = selector.slice(0, index + 1)
					let afterSelector = selector.slice(index + 1)

					if (primary.startsWith(`always`)) {
						afterSelector = afterSelector.replace(/^\s*/, ` `)
					} else if (primary.startsWith(`never`)) {
						afterSelector = afterSelector.replace(/^\s*/, ``)
					}

					selector = beforeSelector + afterSelector
				}

				if (ruleNode.raws.selector) {
					ruleNode.raws.selector.raw = selector
				} else {
					ruleNode.selector = selector
				}
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
