import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.js"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.js"
import { isNumber } from "../../utils/validateTypes/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `selector-max-empty-lines`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? `line` : `lines`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Limits the number of adjacent empty lines within selectors.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	let maxAdjacentNewlines = primary + 1

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: isNumber,
		})

		if (!validOptions) return

		let violatedCRLFNewLinesRegex = new RegExp(`(?:\r\n){${maxAdjacentNewlines + 1},}`, `u`)
		let violatedLFNewLinesRegex = new RegExp(`\n{${maxAdjacentNewlines + 1},}`, `u`)
		let allowedLFNewLinesString = `\n`.repeat(maxAdjacentNewlines)
		let allowedCRLFNewLinesString = `\r\n`.repeat(maxAdjacentNewlines)

		root.walkRules((ruleNode) => {
			let selectorRaws = ruleNode.raws.selector
			let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

			// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw read here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. The positions are reported in the file's own coordinates, and a fix is written to both copies. The line break that closes each comment stands outside it and survives the fix, since collapsing the empty lines always leaves the first break standing.
			let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

			if (violatedLFNewLinesRegex.test(selector) || violatedCRLFNewLinesRegex.test(selector)) {
				report({
					message: messages.expected,
					messageArgs: [primary],
					node: ruleNode,
					index: 0,
					endIndex: toSelectorSourceIndex(selector.length, inlineComments),
					result,
					ruleName,
					fix () {
						let newSelectorString = selector
							.replaceAll(new RegExp(violatedLFNewLinesRegex, `gmu`), allowedLFNewLinesString)
							.replaceAll(new RegExp(violatedCRLFNewLinesRegex, `gmu`), allowedCRLFNewLinesString)

						if (selectorRaws) {
							selectorRaws.raw = newSelectorString

							// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
							if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(newSelectorString, inlineComments)
						}
						else ruleNode.selector = newSelectorString
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
