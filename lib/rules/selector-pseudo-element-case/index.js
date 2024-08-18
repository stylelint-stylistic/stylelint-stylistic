import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isStandardSyntaxRule from "../../utils/isStandardSyntaxRule.js"
import isStandardSyntaxSelector from "../../utils/isStandardSyntaxSelector.js"
import { levelOneAndTwoPseudoElements } from "../../reference/selectors.js"
import transformSelector from "../../utils/transformSelector.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `selector-pseudo-element-case`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) {
			return
		}

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return
			}

			const selector = ruleNode.selector

			if (!selector.includes(`:`)) {
				return
			}

			transformSelector(result, ruleNode, (selectorTree) => {
				selectorTree.walkPseudos((pseudoNode) => {
					const pseudoElement = pseudoNode.value

					if (!isStandardSyntaxSelector(pseudoElement)) {
						return
					}

					if (!pseudoElement.includes(`::`) && !levelOneAndTwoPseudoElements.has(pseudoElement.toLowerCase().slice(1))) {
						return
					}

					const expectedPseudoElement = primary === `lower` ? pseudoElement.toLowerCase() : pseudoElement.toUpperCase()

					if (pseudoElement === expectedPseudoElement) {
						return
					}

					report({
						message: messages.expected(pseudoElement, expectedPseudoElement),
						node: ruleNode,
						index: pseudoNode.sourceIndex,
						ruleName,
						result,
						fix () {
							pseudoNode.value = expectedPseudoElement
						},
					})
				})
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
