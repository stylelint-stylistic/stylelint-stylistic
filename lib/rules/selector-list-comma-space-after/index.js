import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.js"
import { selectorListCommaWhitespaceChecker } from "../../utils/selectorListCommaWhitespaceChecker/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `selector-list-comma-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ","`,
	rejectedAfter: () => `Unexpected whitespace after ","`,
	expectedAfterSingleLine: () => `Expected single space after "," in a single-line list`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "," in a single-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace after the commas of selector lists.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		/** @type {Map<import('postcss').Rule, number[]> | undefined} */
		let fixData

		selectorListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: (ruleNode, index) => {
				fixData = fixData || (new Map())

				let commaIndices = fixData.get(ruleNode) || []

				commaIndices.push(index)
				fixData.set(ruleNode, commaIndices)

				return true
			},
		})

		if (fixData) {
			for (let [ruleNode, commaIndices] of fixData.entries()) {
				let selectorRaws = ruleNode.raws.selector
				let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

				// The comments are read off the two spellings before anything is written, since the alignment the pair is read by holds only while the copies tell one story.
				let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

				for (let index of commaIndices.toSorted((a, b) => b - a)) {
					let beforeSelector = selector.slice(0, index + 1)
					let afterSelector = selector.slice(index + 1)

					if (primary.startsWith(`always`)) afterSelector = afterSelector.replace(/^\s*/u, ` `)
					else if (primary.startsWith(`never`)) afterSelector = afterSelector.replace(/^\s*/u, ``)

					selector = beforeSelector + afterSelector
				}

				if (selectorRaws) {
					selectorRaws.raw = selector

					// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
					if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(selector, inlineComments)
				}
				else ruleNode.selector = selector
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
