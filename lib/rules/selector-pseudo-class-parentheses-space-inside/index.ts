import type { Container, Node, Root, Spaces } from "postcss-selector-parser"
import stylelint from "stylelint"

import { LEADING_CSS_WHITESPACE, LEADING_WHITESPACE_OR_BLOCK_COMMENT, LEADING_WHITESPACE_RUN, LINE_BREAK, TRAILING_WHITESPACE_RUN, WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorSearchCopy } from "../../utils/selectorSearchCopy/index.ts"
import { runInFront } from "../../utils/writesTwinRun/index.ts"

let { utils: { report, validateOptions } } = stylelint

/** A selector node with the raws a comment adds; `toString()` prints them over `spaces` and `value`. */
type NodeWithRaws = Node & {
	raws?: {
		spaces?: Partial<Spaces>,
		value?: string,
	},
}

let shortName = `selector-pseudo-class-parentheses-space-inside`

const MESSAGES = defineMessages({
	expectedOpening: `Expected single space after "("`,
	rejectedOpening: `Unexpected whitespace after "("`,
	expectedClosing: `Expected single space before ")"`,
	rejectedClosing: `Unexpected whitespace before ")"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space inside the parentheses, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires a single space or disallows whitespace inside the parentheses of pseudo-class selectors.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let written = primary === `always` ? ` ` : ``

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!syntax.isStandardRule(ruleNode)) return

			if (!ruleNode.selector.includes(`(`)) return

			let edits: Edit[] = []

			let copies = syntax.selectorCopies(ruleNode)

			let { selector } = copies

			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

			// Every index the check works in is measured in the tree's print, so it must spell the source
			if (!standsForSource(selectorTree, selector)) return

			selectorTree.walkPseudos((pseudoNode) => {
				if (pseudoNode.length === 0) return

				let paramString = pseudoNode.map((node) => node.toString()).join(`,`)
				// The run beside the parenthesis is read over the copy with the escapes masked, where an escaped space is a character of the argument and no run at all (1789661964), and written into the selector at the index it was read at: the parser files an escaped tab in the spaces of the node beside it and prints it back as the source spells it (1789666655)
				let { runString } = selectorSearchCopy(paramString)
				// Multi-line by line feed only, as PostCSS counts lines
				let isParamStringMultiline = LINE_BREAK.test(paramString)
				let openIndex = pseudoNode.sourceIndex + pseudoNode.value.length + 1

				// The whitespace at each end hangs on the node there
				let firstNode = firstNodeInside(pseudoNode)
				let lastNode = lastNodeInside(pseudoNode)

				if (firstNode) {
					let nextCharIsSpace = paramString.startsWith(` `)
					// No escape reaches over the parenthesis, so the run behind it opens on the backslash of one and never covers a character of the argument
					let run = (runString.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]
					let edit = { start: openIndex, end: openIndex + run.length, text: written }

					if (nextCharIsSpace && primary === `never`) complain(messages.rejectedOpening, openIndex, edit)

					if (!nextCharIsSpace && primary === `always`) complain(messages.expectedOpening, openIndex, edit)
				}

				// A closing run ending a `//` comment: either option would write the `)` into it
				if (copies.comments.some((inlineComment) => inlineComment.startIndex < openIndex + paramString.trimEnd().length && openIndex + paramString.trimEnd().length <= inlineComment.endIndex)) lastNode = undefined

				if (lastNode) {
					let prevCharIsSpace = runString.endsWith(` `)
					let closeIndex = openIndex + paramString.length - 1
					let run = runInFront(runString, paramString.length)
					let edit = { start: closeIndex + 1 - run.length, end: closeIndex + 1, text: written }
					// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `a:not(b\⏎)` would come out as `a:not(b\ )`, an escaped space, so the warning stands with no fix (1789664271)
					let keepsTheEscape = editKeepsEscapedCharacter(selector, edit)

					if (prevCharIsSpace && primary === `never` && !isParamStringMultiline) complain(messages.rejectedClosing, closeIndex, keepsTheEscape ? edit : undefined)

					if (!prevCharIsSpace && primary === `always`) complain(messages.expectedClosing, closeIndex, keepsTheEscape ? edit : undefined)
				}
			})

			if (edits.length > 0) copies.write(applyEditsFromEnd(selector, edits))

			/**
			 * Reports a problem.
			 * @param message - The warning text to report.
			 * @param rawIndex - The index in the parsed selector.
			 * @param edit - The edit fixing it, indexed in the same copy; nothing where the fix is refused.
			 */
			function complain (message: string, rawIndex: number, edit?: Edit): void {
				let index = copies.toSourceIndex(rawIndex)

				report({
					message,
					index,
					endIndex: index,
					result,
					ruleName,
					node: ruleNode,
					...(edit && {
						fix: (): void => {
							edits.push(edit)
						},
					}),
				})
			}
		})
	}
}

/**
 * Tells whether a parsed selector prints as its source, putting back what the parser dropped.
 *
 * `postcss-selector-parser` drops the whitespace between a closing comment and the `)`, or moves it behind the `)`: `a:not( /*c*\/ ):is(b)` prints as `a:not( /*c*\/) :is(b)`. An empty argument prints nothing: no.
 * @param selectorTree - The parsed selector.
 * @param selector - Its source.
 * @returns True if the tree prints as the source.
 */
function standsForSource (selectorTree: Root, selector: string): boolean {
	if (String(selectorTree) === selector) return true

	selectorTree.walk((node) => {
		if (node.type !== `selector`) return

		let comment = node.last

		if (!comment || comment.type !== `comment` || comment.spaces.after) return

		let dropped = leadingWhitespace(selector, comment.sourceIndex + comment.value.length)

		if (!dropped) return

		comment.spaces.after = dropped

		// A run in front of a comma is only dropped; one in front of the `)` moves to the next node, however many parentheses out
		let following = nodeAfter(node.parent)

		if (following) restoreSpaceBefore(following, selector)
	})

	return String(selectorTree) === selector
}

/**
 * The node after another, climbing out of the containers it closes.
 * @param node - The node whose successor is sought.
 * @returns The next node, or nothing at the selector's end.
 */
function nodeAfter (node: Node | Container | undefined): Node | undefined {
	let current: Node | Container | undefined = node

	while (current && current.parent) {
		let next = current.next()

		while (next) {
			if (next.type !== `selector`) return next

			// A list's selector is a container: its head comes next, an empty one is skipped
			next = next.first || next.next()
		}

		current = current.parent
	}
}

/**
 * Gives a node the source whitespace in front of it: a descendant combinator prints its raw value, comments included; anything else `spaces.before`, unless a raw holds it.
 * @param node - The node whose leading whitespace is restored.
 * @param selector - The source.
 */
function restoreSpaceBefore (node: Node, selector: string): void {
	if (node.type === `combinator` && WHITESPACE.test(node.value)) {
		node.spaces.before = ``
		node.spaces.after = ``
		node.raws = { ...node.raws, spaces: { before: ``, after: `` }, value: whitespaceAndComments(selector, node.sourceIndex) }

		return
	}

	if ((node as NodeWithRaws).raws?.spaces?.before === undefined) node.spaces.before = trailingWhitespace(selector, node.sourceIndex)
}

/**
 * The whitespace run at an index.
 * @param text - The selector source the run is read from.
 * @param index - The offset the run starts at.
 * @returns The run, empty where none.
 */
function leadingWhitespace (text: string, index: number): string {
	let match = LEADING_WHITESPACE_RUN.exec(text.slice(index))

	return match ? match[0] : ``
}

/**
 * The run of whitespace and comments at an index, read by content since a namespaced node's index is at its local name, not its prefix.
 * @param text - The selector source the run is read from.
 * @param index - The offset the run starts at.
 * @returns The run, empty where none.
 */
function whitespaceAndComments (text: string, index: number): string {
	let end = index

	for (;;) {
		let match = LEADING_WHITESPACE_OR_BLOCK_COMMENT.exec(text.slice(end))

		if (!match) return text.slice(index, end)

		end += match[0].length
	}
}

/**
 * The whitespace run in front of an index.
 * @param text - The selector source the run is read from.
 * @param index - The offset the run ends at.
 * @returns The run, empty where none.
 */
function trailingWhitespace (text: string, index: number): string {
	let match = TRAILING_WHITESPACE_RUN.exec(text.slice(0, index))

	return match ? match[0] : ``
}

/**
 * The first node inside a container, down through nested selectors.
 * @param node - The container.
 * @returns The node, or nothing where empty.
 */
function firstNodeInside (node: Container): Node | undefined {
	let target = node.first

	while (target && target.type === `selector`) target = target.first

	return target
}

/**
 * The last node inside a container, down through nested selectors.
 * @param node - The container.
 * @returns The node, or nothing where empty.
 */
function lastNodeInside (node: Container): Node | undefined {
	let target = node.last

	while (target && target.type === `selector`) target = target.last

	return target
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
