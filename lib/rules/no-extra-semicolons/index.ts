import type { Comment, Node } from "postcss"
import styleSearch from "style-search"
import stylelint, { type FixCallback } from "stylelint"

import { INLINE_COMMENT_BREAK, WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { extraSemicolonsAfter, extraSemicolonsBefore, noExtraUnderComment, readsTheRawsOf } from "../../utils/extraSemicolonsAfter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule, isComment } from "../../utils/typeGuards/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `no-extra-semicolons`

const MESSAGES = defineMessages({
	rejected: `Unexpected extra semicolon`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Finds the source index of a node's first character.
 * @param node - The node whose start is located in the source.
 * @returns The index, or 0 inside a document.
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

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/**
 * Disallows extra semicolons.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) return

		let fix: FixCallback | undefined

		if (root.raws.after && root.raws.after.trim().length > 0) {
			let rawAfterRoot = root.raws.after
			let readsAsNoExtra = noExtraUnderComment(syntax, root, `after`, result)

			let fixSemiIndices: number[] = []

			styleSearch({ source: rawAfterRoot, target: `;` }, (match) => {
				if (readsAsNoExtra(match.startIndex)) return

				fix = (): void => {
					fixSemiIndices.push(match.startIndex)
				}

				if (!root.source) throw new Error(`The root node must have a source`)

				complain(root.source.input.css.length - rawAfterRoot.length + match.startIndex)
			})

			if (fixSemiIndices.length > 0) root.raws.after = removeIndices(rawAfterRoot, fixSemiIndices)
		}

		root.walk((node) => {
			if (!readsTheRawsOf(syntax, node)) return

			let extraBefore = extraSemicolonsBefore(syntax, node, result)

			if (extraBefore.length > 0 && typeof node.raws.before === `string`) {
				let rawBeforeNode = node.raws.before
				let fixSemiIndices: number[] = []

				for (let semicolon of extraBefore) {
					fix = (): void => {
						fixSemiIndices.push(semicolon)
					}

					complain(getOffsetByNode(node) - rawBeforeNode.length + semicolon)
				}

				if (fixSemiIndices.length > 0) node.raws.before = removeIndices(rawBeforeNode, fixSemiIndices)
			}

			// A Less mixin last child puts its extra semicolon in `node.raws.after`; mixins are passed over, and the rest of the node with them
			if (typeof node.raws.after === `string` && node.raws.after.trim().length > 0 && `last` in node && node.last && isAtRule(node.last) && !readsTheRawsOf(syntax, node.last)) return

			let extraAfter = extraSemicolonsAfter(syntax, node, result)

			if (extraAfter.length > 0 && typeof node.raws.after === `string`) {
				let rawAfterNode = node.raws.after
				let fixSemiIndices: number[] = []

				for (let semicolon of extraAfter) {
					fix = (): void => {
						fixSemiIndices.push(semicolon)
					}

					complain(getOffsetByNode(node) + nodeString(node, result).length - 1 - rawAfterNode.length + semicolon)
				}

				if (fixSemiIndices.length > 0) node.raws.after = removeIndices(rawAfterNode, fixSemiIndices)
			}

			// Less closes a `//` comment on a bare carriage return too, where `postcss-less` reads on to a line feed, and the code behind that break is Less's
			if (isComment(node)) checkCommentCode(node)

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
		 * Reports the semicolons of the code a `//` comment node holds that close nothing.
		 * @param comment - The comment node.
		 */
		function checkCommentCode (comment: Comment): void {
			let code = syntax.inlineCommentCode(comment)
			let left = comment.raws.left ?? ``
			let fixSemiIndices: number[] = []

			for (let index of code === null ? [] : semicolonsClosingNothing(code)) {
				fix = (): void => {
					fixSemiIndices.push(index - left.length)
				}

				// The node prints as `//`, its `raws.left` and its text
				complain(getOffsetByNode(comment) + 2 + index)
			}

			if (fixSemiIndices.length > 0) comment.text = removeIndices(comment.text, fixSemiIndices)
		}

		/**
		 * Reports an extra semicolon.
		 * @param index - The offset of the semicolon in the source.
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
 * Finds the semicolons of the code a `//` comment node holds that close nothing: those with only whitespace between them and the break closing the comment or the semicolon in front. Strings and the arguments of calls are text, and so is a semicolon a backslash escapes.
 * @param code - The copy of the comment's `raws.left` and text with all but the code blanked.
 * @returns The semicolons' indices in the copy.
 */
function semicolonsClosingNothing (code: string): number[] {
	let indices: number[] = []
	let opens = code.search(INLINE_COMMENT_BREAK) + 1

	styleSearch({ source: code, target: `;`, functionArguments: `skip` }, (match) => {
		if (match.startIndex < opens || !editKeepsEscapedCharacter(code, { start: match.startIndex, end: match.startIndex + 1, text: `` })) return

		if (WHITESPACE_OR_NOTHING.test(code.slice(opens, match.startIndex))) indices.push(match.startIndex)

		opens = match.startIndex + 1
	})

	return indices
}

/**
 * Removes the characters at the given indices.
 * @param str - The string.
 * @param indices - The offsets of the semicolons to drop.
 * @returns The rest.
 */
function removeIndices (str: string, indices: number[]): string {
	let result = str

	for (let index of indices.toReversed()) result = result.slice(0, index) + result.slice(index + 1)

	return result
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
