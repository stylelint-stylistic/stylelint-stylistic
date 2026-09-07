import type { Container, Node, Root, Spaces } from "postcss-selector-parser"
import stylelint, { type FixCallback } from "stylelint"

import { LEADING_WHITESPACE_OR_BLOCK_COMMENT, LEADING_WHITESPACE_RUN, LINE_BREAK, TRAILING_WHITESPACE_RUN, WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

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
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!syntax.isStandardRule(ruleNode)) return

			if (!ruleNode.selector.includes(`(`)) return

			let fix: FixCallback | undefined
			let hasFixed = false

			let copies = syntax.selectorCopies(ruleNode)

			let { selector } = copies

			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

			// A fix writes the whole selector back, so the tree must print as the source
			if (!standsForSource(selectorTree, selector)) return

			selectorTree.walkPseudos((pseudoNode) => {
				if (pseudoNode.length === 0) return

				let paramString = pseudoNode.map((node) => node.toString()).join(`,`)
				// Multi-line by line feed only, as PostCSS counts lines
				let isParamStringMultiline = LINE_BREAK.test(paramString)
				let openIndex = pseudoNode.sourceIndex + pseudoNode.value.length + 1

				// The whitespace at each end hangs on the node there
				let firstNode = firstNodeInside(pseudoNode)
				let lastNode = lastNodeInside(pseudoNode)

				if (firstNode) {
					let nextCharIsSpace = paramString.startsWith(` `)

					if (nextCharIsSpace && primary === `never`) {
						fix = (): void => {
							hasFixed = true
							setSpaceBefore(firstNode, ``)
						}
						complain(messages.rejectedOpening, openIndex)
					}

					if (!nextCharIsSpace && primary === `always`) {
						fix = (): void => {
							hasFixed = true
							setSpaceBefore(firstNode, ` `)
						}
						complain(messages.expectedOpening, openIndex)
					}
				}

				// A closing run ending a `//` comment: either option would write the `)` into it
				if (copies.comments.some((inlineComment) => inlineComment.startIndex < openIndex + paramString.trimEnd().length && openIndex + paramString.trimEnd().length <= inlineComment.endIndex)) lastNode = undefined

				if (lastNode) {
					let prevCharIsSpace = paramString.endsWith(` `)
					let closeIndex = openIndex + paramString.length - 1

					if (prevCharIsSpace && primary === `never` && !isParamStringMultiline) {
						fix = (): void => {
							hasFixed = true
							setSpaceAfter(lastNode, ``)
						}
						complain(messages.rejectedClosing, closeIndex)
					}

					if (!prevCharIsSpace && primary === `always`) {
						fix = (): void => {
							hasFixed = true
							setSpaceAfter(lastNode, ` `)
						}
						complain(messages.expectedClosing, closeIndex)
					}
				}
			})

			if (hasFixed) {
				let fixedSelector = String(selectorTree)

				copies.write(fixedSelector)
			}

			/**
			 * Reports a problem.
			 * @param message - The warning text to report.
			 * @param rawIndex - The index in the parsed selector.
			 */
			function complain (message: string, rawIndex: number): void {
				let index = copies.toSourceIndex(rawIndex)

				report({
					message,
					index,
					endIndex: index,
					result,
					ruleName,
					node: ruleNode,
					...(fix && { fix }),
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

/**
 * Sets the space before a node, in `raws.spaces` too where a comment moved the run there, since `toString()` prints the raw.
 * @param target - The node.
 * @param value - The space.
 */
function setSpaceBefore (target: Node, value: string): void {
	target.spaces.before = value

	let spaces = (target as NodeWithRaws).raws?.spaces

	if (spaces?.before !== undefined) spaces.before = value + spaces.before.replace(LEADING_WHITESPACE_RUN, ``)
}

/**
 * The mirror of `setSpaceBefore`, whose raws branch has no reproducer: the parser writes `raws.spaces.before` only on a combinator behind a comment.
 * @param target - The node.
 * @param value - The space.
 */
function setSpaceAfter (target: Node, value: string): void {
	target.spaces.after = value

	let spaces = (target as NodeWithRaws).raws?.spaces

	if (spaces?.after !== undefined) spaces.after = spaces.after.replace(TRAILING_WHITESPACE_RUN, ``) + value
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
