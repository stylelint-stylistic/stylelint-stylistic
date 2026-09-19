import type { Node, Root } from "postcss"
import type { Attribute } from "postcss-selector-parser"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { parseSelector } from "../parseSelector/index.ts"
import { selectorSearchCopy } from "../selectorSearchCopy/index.ts"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around attribute operators in selectors.
 * @param options - The root, result, syntax, location checker and fixer of the calling rule.
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
	isFixable?: ((text: string, index: number, runString: string) => boolean),
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
			// The parser reads an escaped space as a character of the attribute's name, so the fix writes the operator's own spaces alone; the check reads the run over the copy where it is none either (1789661964)
			let { runString } = selectorSearchCopy(attributeNodeString)

			styleSearch({ source: attributeNodeString, target: operator }, (match) => {
				let index = options.checkBeforeOperator ? match.startIndex : match.endIndex - 1

				checkOperator(attributeNodeString, runString, index, rule, attributeNode, operator)
			})
		})

		if (hasFixed) {
			let fixedSelector = String(selectorTree)

			copies.write(fixedSelector)
		}

		/**
		 * Checks one operator.
		 * @param text - The attribute's text as the parseable copy of the selector spells it.
		 * @param source - The copy of it the run is read over.
		 * @param index - The index checked.
		 * @param node - The node reported.
		 * @param attributeNode - The parsed selector node handed to the fixer.
		 * @param operator - The matched text, `=` or a two-character form.
		 */
		function checkOperator (text: string, source: string, index: number, node: Node, attributeNode: Attribute, operator: string): void {
			options.locationChecker({
				source,
				index,
				err: (msg) => {
					let problemIndex = copies.toSourceIndex(attributeNode.sourceIndex + index)
					// The rule's own fix guard, asked here so a clean operator is never asked about
					let isFixable = fix && (!options.isFixable || options.isFixable(text, index, source))

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
						...(fix && isFixable && {
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
