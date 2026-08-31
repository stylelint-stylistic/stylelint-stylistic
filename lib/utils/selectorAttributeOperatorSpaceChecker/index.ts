import type { Node, Root } from "postcss"
import type { Attribute } from "postcss-selector-parser"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { parseSelector } from "../parseSelector/index.ts"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around attribute operators in selectors.
 * @param options - The options object.
 */
export function selectorAttributeOperatorSpaceChecker (options: {
	root: Root,
	result: PostcssResult,
	syntax: Syntax,
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
		if (!options.syntax.isStandardRule(rule)) return

		let copies = options.syntax.selectorCopies(rule)
		let { selector } = copies

		if (!selector.includes(`[`) || !selector.includes(`=`)) return

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

			copies.write(fixedSelector)
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
					let problemIndex = copies.toSourceIndex(attributeNode.sourceIndex + index)

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
						...(fix && {
							fix: (): void => {
								hasFixed = true

								fix(attributeNode)
							},
						}),
					})
				},
			})
		}
	})
}
