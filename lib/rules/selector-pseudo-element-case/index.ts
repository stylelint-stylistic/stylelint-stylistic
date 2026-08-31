import stylelint from "stylelint"

import { LEVEL_ONE_AND_TWO_PSEUDO_ELEMENTS } from "../../reference/selectors.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { transformSelector } from "../../utils/transformSelector/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `selector-pseudo-element-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies lowercase or uppercase for pseudo-element selectors.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `lower` and `upper`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `lower` | `upper`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!syntax.isStandardRule(ruleNode)) return

			let selector = ruleNode.selector

			if (!selector.includes(`:`)) return

			transformSelector(result, ruleNode, (selectorTree) => {
				selectorTree.walkPseudos((pseudoNode) => {
					let pseudoElement = pseudoNode.value

					if (!syntax.isStandardSelector(pseudoElement)) return

					if (!pseudoElement.includes(`::`) && !LEVEL_ONE_AND_TWO_PSEUDO_ELEMENTS.has(pseudoElement.toLowerCase().slice(1))) return

					let expectedPseudoElement = primary === `lower` ? pseudoElement.toLowerCase() : pseudoElement.toUpperCase()

					if (pseudoElement === expectedPseudoElement) return

					report({
						message: messages.expected,
						messageArgs: [pseudoElement, expectedPseudoElement],
						node: ruleNode,
						index: pseudoNode.sourceIndex,
						endIndex: pseudoNode.sourceIndex,
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

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
