import stylelint from "stylelint"

import { LEVEL_ONE_AND_TWO_PSEUDO_ELEMENTS } from "../../reference/selectors.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.js"
import { isStandardSyntaxSelector } from "../../utils/isStandardSyntaxSelector/index.js"
import { parseSelector } from "../../utils/parseSelector/index.js"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.js"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `selector-pseudo-class-case`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies lowercase or uppercase for pseudo-class selectors.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) return

			let selectorRaws = ruleNode.raws.selector
			let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

			if (!selector.includes(`:`)) return

			// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw parsed here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw and reported in the file's own coordinates, and a fix is written to both copies.
			let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)
			let hasFixed = false

			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

			selectorTree.walkPseudos((pseudoNode) => {
				let pseudo = pseudoNode.value

				if (!isStandardSyntaxSelector(pseudo)) return

				if (pseudo.includes(`::`) || LEVEL_ONE_AND_TWO_PSEUDO_ELEMENTS.has(pseudo.toLowerCase().slice(1))) return

				let expectedPseudo = primary === `lower` ? pseudo.toLowerCase() : pseudo.toUpperCase()

				if (pseudo === expectedPseudo) return

				let sourceIndex = toSelectorSourceIndex(pseudoNode.sourceIndex, inlineComments)

				report({
					message: messages.expected,
					messageArgs: [pseudo, expectedPseudo],
					node: ruleNode,
					index: sourceIndex,
					endIndex: sourceIndex,
					ruleName,
					result,
					fix () {
						hasFixed = true
						pseudoNode.value = expectedPseudo
					},
				})
			})

			if (hasFixed) {
				let fixedSelector = String(selectorTree)

				if (selectorRaws) {
					selectorRaws.raw = fixedSelector

					// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
					if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, inlineComments)
				}
				else ruleNode.selector = fixedSelector
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
