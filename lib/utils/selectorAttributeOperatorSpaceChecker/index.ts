import type { Node, Root } from "postcss"
import type { Attribute } from "postcss-selector-parser"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { editKeepsEscapedCharacter } from "../editKeepsEscapedCharacter/index.ts"
import { parseSelector } from "../parseSelector/index.ts"
import { report } from "../report/index.ts"
import { selectorSearchCopy } from "../selectorSearchCopy/index.ts"

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
	fix?: ((index: number, runString: string) => Edit[]),
}): void {
	let { fix } = options

	options.root.walkRules((rule) => {
		if (!options.syntax.isStandardRule(rule)) return

		let copies = options.syntax.selectorCopies(rule)
		let { selector } = copies

		if (!selector.includes(`[`) || !selector.includes(`=`)) return

		let edits: Edit[] = []

		let selectorTree = parseSelector(selector, options.result, rule)

		if (!selectorTree) return

		selectorTree.walkAttributes((attributeNode) => {
			let operator = attributeNode.operator

			if (!operator) return

			let attributeNodeString = attributeNode.toString()

			// The parser reads a backslash in front of a tab as no escape and files what follows into parts it prints back in another order, so `[a=\⇥\⇥b]` comes back as `[a=\⇥b⇥]`: an attribute whose parts do not spell the source is passed over, since every index here is measured in them (1789666655)
			if (!selector.startsWith(attributeNodeString, attributeNode.sourceIndex)) return

			// The parser reads an escaped space as a character of the attribute's name, and a tab behind a backslash as whitespace of its own; the run is read over the copy where the escapes are masked, and the fix cuts it out of the selector (1789661964, 1789666655)
			let { runString } = selectorSearchCopy(attributeNodeString)

			styleSearch({ source: attributeNodeString, target: operator }, (match) => {
				let index = options.checkBeforeOperator ? match.startIndex : match.endIndex - 1

				checkOperator(runString, index, rule, attributeNode, operator)
			})
		})

		if (edits.length > 0) copies.write(applyEditsFromEnd(selector, edits))

		/**
		 * Checks one operator.
		 * @param source - The copy of the attribute's text the run is read over.
		 * @param index - The index checked.
		 * @param node - The node reported.
		 * @param attributeNode - The parsed attribute, whose `sourceIndex` the edits and the report are measured from.
		 * @param operator - The matched text, `=` or a two-character form.
		 */
		function checkOperator (source: string, index: number, node: Node, attributeNode: Attribute, operator: string): void {
			// Indexed in the selector, which the attribute's parts spell from its own index on
			let operatorEdits = fix ? fix(index, source).map(({ start, end, text: written }) => ({ start: attributeNode.sourceIndex + start, end: attributeNode.sourceIndex + end, text: written })) : []

			options.locationChecker({
				source,
				index,
				err: (msg) => {
					let problemIndex = copies.toSourceIndex(attributeNode.sourceIndex + index)
					// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `[a\⏎=b]` would come out as `[a\=b]`, one attribute name, or `[a\ =b]`, an escaped space (1789664271)
					let isFixable = fix && operatorEdits.every((edit) => editKeepsEscapedCharacter(selector, edit))

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
								edits.push(...operatorEdits)
							},
						}),
					})
				},
			})
		}
	})
}
