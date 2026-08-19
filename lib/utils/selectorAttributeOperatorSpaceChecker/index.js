import styleSearch from "style-search"
import stylelint from "stylelint"

import { findSelectorInlineComments } from "../findSelectorInlineComments/index.js"
import { isStandardSyntaxRule } from "../isStandardSyntaxRule/index.js"
import { parseSelector } from "../parseSelector/index.js"
import { restoreSelectorInlineComments } from "../restoreSelectorInlineComments/index.js"
import { toSelectorSourceIndex } from "../toSelectorSourceIndex/index.js"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around attribute operators in selectors.
 * @param {{
 *   root: import('postcss').Root,
 *   result: import('stylelint').PostcssResult,
 *   locationChecker: (opts: { source: string, index: number, err: (msg: string) => void }) => void,
 *   checkedRuleName: string,
 *   checkBeforeOperator: boolean,
 *   fix: ((attributeNode: import('postcss-selector-parser').Attribute) => boolean),
 * }} options - The options object
 * @returns {void}
 */
export function selectorAttributeOperatorSpaceChecker (options) {
	options.root.walkRules((rule) => {
		if (!isStandardSyntaxRule(rule)) return

		let selectorRaws = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector

		if (!selector.includes(`[`) || !selector.includes(`=`)) return

		// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw parsed here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw and reported in the file's own coordinates, and a fix is written to both copies.
		let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

		let hasFixed = false

		let fixedSelector = parseSelector(selector, options.result, rule, (selectorTree) => {
			selectorTree.walkAttributes((attributeNode) => {
				let operator = attributeNode.operator

				if (!operator) return

				let attributeNodeString = attributeNode.toString()

				styleSearch({ source: attributeNodeString, target: operator }, (match) => {
					let index = options.checkBeforeOperator ? match.startIndex : match.endIndex - 1

					checkOperator(attributeNodeString, index, rule, attributeNode, operator)
				})
			})
		})

		if (hasFixed && fixedSelector) {
			if (selectorRaws) {
				selectorRaws.raw = fixedSelector

				// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
				if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, inlineComments)
			}
			else rule.selector = fixedSelector
		}

		/**
		 * Checks an operator for whitespace violations.
		 * @param {string} source - The source string.
		 * @param {number} index - The index to check.
		 * @param {import('postcss').Node} node - The node with the violation.
		 * @param {import('postcss-selector-parser').Attribute} attributeNode - The attribute node.
		 * @param {string} operator - The operator being checked.
		 */
		function checkOperator (source, index, node, attributeNode, operator) {
			options.locationChecker({
				source,
				index,
				err: (msg) => {
					const problemIndex = toSelectorSourceIndex(attributeNode.sourceIndex + index, inlineComments)

					report({
						message: msg.replace(
							options.checkBeforeOperator ? operator.charAt(0) : operator.at(-1),
							operator,
						),
						node,
						index: problemIndex,
						endIndex: problemIndex,
						result: options.result,
						ruleName: options.checkedRuleName,
						fix: options.fix
							? () => {
								hasFixed = true

								return options.fix(attributeNode)
							}
							: undefined,
					})
				},
			})
		}
	})
}
