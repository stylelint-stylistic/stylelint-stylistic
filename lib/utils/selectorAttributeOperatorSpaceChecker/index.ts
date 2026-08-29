import type { Node, Root } from "postcss"
import type { Attribute } from "postcss-selector-parser"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { findSelectorInlineComments } from "../findSelectorInlineComments/index.ts"
import { isStandardSyntaxRule } from "../isStandardSyntaxRule/index.ts"
import { parseSelector } from "../parseSelector/index.ts"
import { restoreSelectorInlineComments } from "../restoreSelectorInlineComments/index.ts"
import { toSelectorSourceIndex } from "../toSelectorSourceIndex/index.ts"
import type { SyntaxRaw } from "../typeGuards/index.ts"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around attribute operators in selectors.
 * @param options - The options object.
 */
export function selectorAttributeOperatorSpaceChecker (options: {
	root: Root,
	result: PostcssResult,
	locationChecker: (opts: {
		source: string,
		index: number,
		err: (msg: string) => void,
	}) => void,
	checkedRuleName: string,
	checkBeforeOperator: boolean,
	fix?: ((attributeNode: Attribute) => void),
}): void {
	let { fix } = options

	options.root.walkRules((rule) => {
		if (!isStandardSyntaxRule(rule)) return

		let selectorRaws: SyntaxRaw | undefined = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector

		if (!selector.includes(`[`) || !selector.includes(`=`)) return

		// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw parsed here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw and reported in the file's own coordinates, and a fix is written to both copies.
		let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

		let hasFixed = false

		let selectorTree = parseSelector(selector, options.result, rule)

		if (!selectorTree) return

		selectorTree.walkAttributes((attributeNode) => {
			let operator = attributeNode.operator

			if (!operator) return

			let attributeNodeString = attributeNode.toString()

			styleSearch({ source: attributeNodeString, target: operator }, (match) => {
				let index = options.checkBeforeOperator ? match.startIndex : match.endIndex - 1

				checkOperator(attributeNodeString, index, rule, attributeNode, operator)
			})
		})

		if (hasFixed) {
			let fixedSelector = String(selectorTree)

			if (selectorRaws) {
				selectorRaws.raw = fixedSelector

				// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
				if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, inlineComments)
			}
			else rule.selector = fixedSelector
		}

		/**
		 * Checks an operator for whitespace violations.
		 * @param source - The source string.
		 * @param index - The index to check.
		 * @param node - The node with the violation.
		 * @param attributeNode - The attribute node.
		 * @param operator - The operator being checked.
		 */
		function checkOperator (source: string, index: number, node: Node, attributeNode: Attribute, operator: string): void {
			options.locationChecker({
				source,
				index,
				err: (msg) => {
					let problemIndex = toSelectorSourceIndex(attributeNode.sourceIndex + index, inlineComments)

					report({
						message: msg.replace(
							options.checkBeforeOperator ? operator.charAt(0) : operator.slice(-1),
							operator,
						),
						node,
						index: problemIndex,
						endIndex: problemIndex,
						result: options.result,
						ruleName: options.checkedRuleName,
						fix: fix
							? (): void => {
								hasFixed = true

								fix(attributeNode)
							}
							: undefined,
					})
				},
			})
		}
	})
}
