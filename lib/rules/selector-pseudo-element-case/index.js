import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isStandardSyntaxRule from "../../utils/isStandardSyntaxRule.js"
import isStandardSyntaxSelector from "../../utils/isStandardSyntaxSelector.js"
import { levelOneAndTwoPseudoElements } from "../../reference/selectors.js"
import transformSelector from "../../utils/transformSelector.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `selector-pseudo-element-case`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
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

			let selector = ruleNode.selector

			if (!selector.includes(`:`)) {
				return
			}

			transformSelector(result, ruleNode, (selectorTree) => {
				selectorTree.walkPseudos((pseudoNode) => {
					let pseudoElement = pseudoNode.value

					if (!isStandardSyntaxSelector(pseudoElement)) {
						return
					}

					if (!pseudoElement.includes(`::`) && !levelOneAndTwoPseudoElements.has(pseudoElement.toLowerCase().slice(1))) {
						return
					}

					let expectedPseudoElement = primary === `lower` ? pseudoElement.toLowerCase() : pseudoElement.toUpperCase()

					if (pseudoElement === expectedPseudoElement) {
						return
					}

					report({
						message: messages.expected,
						messageArgs: [pseudoElement, expectedPseudoElement],
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
