import type { Comment, Node } from "postcss"
import styleSearch from "style-search"
import stylelint, { type FixCallback, type PostcssResult } from "stylelint"

import { EVERY_SEMICOLON, INLINE_COMMENT_BREAK, WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { closingOffset } from "../../utils/closingOffset/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { extraSemicolonsAfter, extraSemicolonsBefore, extraSemicolonsOwn, noExtraUnderComment, readsTheRawsOf } from "../../utils/extraSemicolonsAfter/index.ts"
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
 * Finds the index of a node's first character in its root's text, which `report` counts a root's index from: the node's offset less the root's, since a root a document holds, a `<style>` block's or a template's, counts its nodes' offsets from the document's start.
 * @param node - The node whose start is located.
 * @returns The index.
 * @throws {Error} Where the node or its root has no start offset.
 */
function getOffsetByNode (node: Node): number {
	let start = node.source?.start?.offset
	let rootStart = node.root().source?.start?.offset

	if (start === undefined || rootStart === undefined) throw new Error(`The node and its root must have a start offset`)

	return start - rootStart
}

/**
 * Finds the index behind a container's last character in its root's text, counted as {@link getOffsetByNode} counts: from the parser's end where {@link closingOffset} trusts it, else from the length of the print, which runs longer than the file where PostCSS escapes `<style` or `<!--`.
 * @param node - The container.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The index.
 * @throws {Error} Where the root has no start offset.
 */
function getEndOffsetByNode (node: Node, result: PostcssResult): number {
	let end = closingOffset(node)
	let rootStart = node.root().source?.start?.offset

	if (rootStart === undefined) throw new Error(`The root must have a start offset`)

	return end === undefined ? getOffsetByNode(node) + nodeString(node, result).length : end - rootStart
}

/**
 * Places a semicolon of a raw by the semicolons behind it rather than by characters.
 *
 * A rule listed earlier may have rewritten the raw in the same run — trimming a line, taking a break out or adding one — while the text and the node's offsets stay as the parser read them; counted by characters or by breaks from the raw's end, the semicolon then lands on another line of the text, where a disable comment covers it or does not. Neighbors taking whitespace keep every semicolon, so the semicolon with as many semicolons behind it in the raw as it stands is the one with as many behind it in the text, scanning back from the raw's end. Where the text holds too few, it is counted by characters, as before.
 * @param text - The text the root's offsets index: the file, or an embedded stylesheet's own text.
 * @param rawEnd - The offset in it the raw ends at.
 * @param raw - The raw as it stands.
 * @param semicolon - The semicolon's index in the raw.
 * @returns Its offset in that text.
 */
function placedBySemicolons (text: string, rawEnd: number, raw: string, semicolon: number): number {
	let behind = (raw.slice(semicolon + 1).match(EVERY_SEMICOLON) ?? []).length
	let place = [...text.slice(0, rawEnd).matchAll(EVERY_SEMICOLON)].at(-1 - behind)?.index

	return place ?? rawEnd - raw.length + semicolon
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
		// The text the offsets below index: the file, or an embedded stylesheet's own text, whose offsets count from the root's start
		let text = root.source?.input.css ?? ``

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

				complain(placedBySemicolons(text, text.length, rawAfterRoot, match.startIndex))
			})

			if (fixSemiIndices.length > 0) root.raws.after = removeIndices(rawAfterRoot, fixSemiIndices)
		}

		root.walk((node) => {
			if (!readsTheRawsOf(syntax, node)) return

			takeOut(node, `before`, extraSemicolonsBefore(syntax, node, result), (raw, semicolon) => getOffsetByNode(node) - raw.length + semicolon)

			// A Less mixin last child puts its extra semicolon in `node.raws.after`; mixins are passed over, and the rest of the node with them
			if (typeof node.raws.after === `string` && node.raws.after.trim().length > 0 && `last` in node && node.last && isAtRule(node.last) && !readsTheRawsOf(syntax, node.last)) return

			let extraAfter = extraSemicolonsAfter(syntax, node, result)
			let extraOwn = extraSemicolonsOwn(syntax, node)
			// The node ends on `raws.ownSemicolon`, which stands behind the closing brace `raws.after` ends on
			let end = extraAfter.length > 0 || extraOwn.length > 0 ? getEndOffsetByNode(node, result) : 0
			let ownLength = String(node.raws.ownSemicolon ?? ``).length

			takeOut(node, `after`, extraAfter, (raw, semicolon) => end - ownLength - 1 - raw.length + semicolon)

			// Less closes a `//` comment on a bare carriage return too, where `postcss-less` reads on to a line feed, and the code behind that break is Less's
			if (isComment(node)) checkCommentCode(node)

			takeOut(node, `ownSemicolon`, extraOwn, (raw, semicolon) => end - raw.length + semicolon)
		})

		/**
		 * Reports the extra semicolons of one raw of a node and takes them out.
		 * @param owner - The node.
		 * @param key - The raw.
		 * @param semicolons - The indices of the extra semicolons in the raw.
		 * @param offsetOf - The offset in the source of a semicolon of the raw.
		 */
		function takeOut (owner: Node, key: `before` | `after` | `ownSemicolon`, semicolons: number[], offsetOf: (raw: string, semicolon: number) => number): void {
			let raw: unknown = owner.raws[key]

			if (semicolons.length === 0 || typeof raw !== `string`) return

			let fixSemiIndices: number[] = []

			for (let semicolon of semicolons) {
				fix = (): void => {
					fixSemiIndices.push(semicolon)
				}

				complain(placedBySemicolons(text, offsetOf(raw, raw.length), raw, semicolon))
			}

			if (fixSemiIndices.length > 0) (owner.raws as Record<string, unknown>)[key] = removeIndices(raw, fixSemiIndices)
		}

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
