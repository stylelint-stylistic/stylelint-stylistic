import stylelint from "stylelint"

import { LEVEL_ONE_AND_TWO_PSEUDO_ELEMENTS } from "../../reference/selectors.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.ts"
import type { SyntaxRaw } from "../../utils/typeGuards/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `selector-pseudo-class-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies lowercase or uppercase for pseudo-class selectors.
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

			let selectorRaws: SyntaxRaw | undefined = ruleNode.raws.selector
			let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

			if (!selector.includes(`:`)) return

			// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw parsed here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw and reported in the file's own coordinates, and a fix is written to both copies.
			let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)
			let hasFixed = false

			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

			selectorTree.walkPseudos((pseudoNode) => {
				let pseudo = pseudoNode.value

				if (!syntax.isStandardSelector(pseudo)) return

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

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
