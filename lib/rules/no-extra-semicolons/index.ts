import type { Node } from "postcss"
import styleSearch from "style-search"
import stylelint, { type FixCallback } from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isStandardSyntaxAtRule } from "../../utils/isStandardSyntaxAtRule/index.ts"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule } from "../../utils/typeGuards/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `no-extra-semicolons`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	rejected: `Unexpected extra semicolon`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Gets the offset by node.
 * @param node - The PostCSS node.
 * @returns The offset index.
 */
function getOffsetByNode (node: Node): number {
	if (node.parent && `document` in node.parent && node.parent.document) return 0

	let root = node.root()

	if (!root.source) throw new Error(`The root node must have a source`)

	if (!node.source) throw new Error(`The node must have a source`)

	if (!node.source.start) throw new Error(`The source must have a start position`)

	let string = root.source.input.css
	let nodeColumn = node.source.start.column
	let nodeLine = node.source.start.line
	let line = 1
	let column = 1
	let index = 0

	for (let i = 0; i < string.length; i += 1) {
		if (column === nodeColumn && nodeLine === line) {
			index = i
			break
		}

		if (string[i] === `\n`) {
			column = 1
			line += 1
		}
		else column += 1
	}

	return index
}

/**
 * Disallows extra semicolons.
 * @param primary - The primary option, which is `true`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: true): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) return

		let fix: FixCallback | undefined

		if (root.raws.after && root.raws.after.trim().length > 0) {
			let rawAfterRoot = root.raws.after

			let fixSemiIndices: number[] = []

			styleSearch({ source: rawAfterRoot, target: `;` }, (match) => {
				fix = (): void => {
					fixSemiIndices.push(match.startIndex)
				}

				if (!root.source) throw new Error(`The root node must have a source`)

				complain(root.source.input.css.length - rawAfterRoot.length + match.startIndex)
			})

			if (fixSemiIndices.length > 0) root.raws.after = removeIndices(rawAfterRoot, fixSemiIndices)
		}

		root.walk((node) => {
			if (isAtRule(node) && !isStandardSyntaxAtRule(node)) return

			if (node.type === `rule` && !isStandardSyntaxRule(node)) return

			if (node.raws.before && node.raws.before.trim().length > 0) {
				let rawBeforeNode = node.raws.before
				let allowedSemi = 0

				let rawBeforeIndexStart = 0

				let fixSemiIndices: number[] = []

				styleSearch({ source: rawBeforeNode, target: `;` }, (match, count) => {
					if (count === allowedSemi) return

					fix = (): void => {
						fixSemiIndices.push(match.startIndex - rawBeforeIndexStart)
					}

					complain(getOffsetByNode(node) - rawBeforeNode.length + match.startIndex)
				})

				if (fixSemiIndices.length > 0) node.raws.before = removeIndices(rawBeforeNode, fixSemiIndices)
			}

			if (typeof node.raws.after === `string` && node.raws.after.trim().length > 0) {
				let rawAfterNode = node.raws.after

				// Where the last child is a Less mixin followed by more than one semicolon, `node.raws.after` holds that semicolon. Less mixins are passed over, so this one is too
				if (`last` in node && node.last && node.last.type === `atrule` && !isStandardSyntaxAtRule(node.last)) return

				let fixSemiIndices: number[] = []

				styleSearch({ source: rawAfterNode, target: `;` }, (match) => {
					fix = (): void => {
						fixSemiIndices.push(match.startIndex)
					}

					let index = getOffsetByNode(node) + nodeString(node, result).length - 1 - rawAfterNode.length + match.startIndex

					complain(index)
				})

				if (fixSemiIndices.length > 0) node.raws.after = removeIndices(rawAfterNode, fixSemiIndices)
			}

			if (typeof node.raws.ownSemicolon === `string`) {
				let rawOwnSemicolon = node.raws.ownSemicolon
				let allowedSemi = 0

				let fixSemiIndices: number[] = []

				styleSearch({ source: rawOwnSemicolon, target: `;` }, (match, count) => {
					if (count === allowedSemi) return

					fix = (): void => {
						fixSemiIndices.push(match.startIndex)
					}

					let index = getOffsetByNode(node) + nodeString(node, result).length - rawOwnSemicolon.length + match.startIndex

					complain(index)
				})

				if (fixSemiIndices.length > 0) node.raws.ownSemicolon = removeIndices(rawOwnSemicolon, fixSemiIndices)
			}
		})

		/**
		 * Reports an extra semicolon violation.
		 * @param index - The index of the violation.
		 */
		function complain (index: number): void {
			report({
				message: messages.rejected,
				node: root,
				index,
				endIndex: index,
				result,
				ruleName,
				...(fix && { fix }),
			})
		}
	}
}

/**
 * Removes characters at the specified indices from a string.
 * @param str - The input string.
 * @param indices - The indices to remove.
 * @returns The string with characters removed.
 */
function removeIndices (str: string, indices: number[]): string {
	let result = str

	for (let index of indices.toReversed()) result = result.slice(0, index) + result.slice(index + 1)

	return result
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
