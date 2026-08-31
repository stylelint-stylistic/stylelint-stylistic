import type { Container, Node, Root, Spaces } from "postcss-selector-parser"
import stylelint, { type FixCallback } from "stylelint"

import { LEADING_WHITESPACE_OR_BLOCK_COMMENT, LEADING_WHITESPACE_RUN, LINE_BREAK, TRAILING_WHITESPACE_RUN, WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

/** A node of the selector with the raws the parser hangs on one it found a comment beside: the run of whitespace and comment it prints in place of `spaces`, and the value it prints in place of the node's own. */
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

/**
 * Requires a single space or disallows whitespace on the inside of the parentheses within pseudo-class selectors.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
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

			// Everything below is measured against the tree and written back from it, so the tree has to stand for the file: a fix made in one pseudo-class is written back with the whole selector list, and would carry off whatever the parser has moved anywhere else in it.
			if (!standsForSource(selectorTree, selector)) return

			selectorTree.walkPseudos((pseudoNode) => {
				if (pseudoNode.length === 0) return

				let paramString = pseudoNode.map((node) => node.toString()).join(`,`)
				// A line ends where PostCSS ends one, on a line feed, which is the break `findSelectorInlineComments` reads as well, so a list broken with one is a multi-line list and a list holding a bare carriage return or a form feed is not.
				let isParamStringMultiline = LINE_BREAK.test(paramString)
				let openIndex = pseudoNode.sourceIndex + pseudoNode.value.length + 1

				// The whitespace this rule has an opinion about is kept on the node standing at that end of the arguments, and an argument with no node in it has none to keep it. So an end with nothing at it has neither a space to report nor anywhere to write one, and each side is asked about on its own, the other going on as before.
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

				// An inline comment ends with the line break standing behind it, and where that break is the whitespace this end is about, it is what an option would write over. A space there would put the closing parenthesis inside the comment, and taking the break away would do the same, so the end is passed over: neither option can be satisfied, and neither can be asked for.
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
			 * Reports a pseudo-class parentheses space violation.
			 * @param message - The error message to report.
			 * @param rawIndex - The index of the violation in the selector as it is parsed.
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
 * Tells whether a parsed selector stands for the source it was parsed from, giving it back what the parser moved on the way where that can be done.
 *
 * `postcss-selector-parser` keeps no whitespace between a comment and the end of the argument it closes: an argument whose last node is a comment has no node to fold the run into, and the parser holds it nowhere else. Where the argument is the last one, the run is handed to whatever stands behind the closing parenthesis, so that `a:not( /*c*\/ ):is(b)` comes back out as `a:not( /*c*\/) :is(b)` — a compound selector turned into a descendant one. Both are put back the way the source spells them: the run goes on the comment, and whatever follows the pseudo-class is given the whitespace the source has in front of it.
 *
 * An argument holding no node at all keeps no whitespace either, and nothing in the tree can hold that one: an empty container prints nothing, whatever its spaces are set to. A selector carrying one is what this answers no for.
 * @param selectorTree - The parsed selector.
 * @param selector - The selector the tree was parsed from.
 * @returns True if the tree gives the selector back the way the source spells it.
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

		// A run standing in front of a comma is only dropped, and the argument behind the comma keeps the whitespace the source gives it. One standing in front of the closing parenthesis is handed on instead, to whatever comes next in the selector — the node behind the pseudo-class, the combinator standing there, or the one that opens the next selector of the list, since the run reaches out of as many parentheses as it has to.
		let following = nodeAfter(node.parent)

		if (following) restoreSpaceBefore(following, selector)
	})

	return String(selectorTree) === selector
}

/**
 * Gets the node that comes after another one in the selector, climbing out of the containers it closes.
 * @param node - The node to look ahead from.
 * @returns The node, or nothing where it closes the selector.
 */
function nodeAfter (node: Node | Container | undefined): Node | undefined {
	let current: Node | Container | undefined = node

	while (current && current.parent) {
		let next = current.next()

		while (next) {
			if (next.type !== `selector`) return next

			// A selector of a list is a container of its own, and the node standing at its head is what comes next in the text. One holding nothing has no such node, and what comes next stands in the selector after it.
			next = next.first || next.next()
		}

		current = current.parent
	}
}

/**
 * Gives a node the whitespace the source has in front of it, writing it where the node prints that whitespace from.
 *
 * A descendant combinator is the whitespace itself, and the parser folds a comment standing in it into the raws beside it, so the whole run — comment and all — is written as the text the combinator prints. Anything else keeps its whitespace in `spaces.before`, and a raw already holding it is left alone, since nothing here could put back what such a raw carries.
 * @param node - The node to give the whitespace to.
 * @param selector - The selector the tree was parsed from.
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
 * Gets the run of whitespace a string has at an index.
 * @param text - The text to read.
 * @param index - The index to read from.
 * @returns The whitespace standing there, empty where none does.
 */
function leadingWhitespace (text: string, index: number): string {
	let match = LEADING_WHITESPACE_RUN.exec(text.slice(index))

	return match ? match[0] : ``
}

/**
 * Gets the run of whitespace and comments a string has at an index.
 *
 * A node's own index is where its text begins, and for a namespaced one that is the local name rather than the prefix in front of it, so the run is read for what it is made of rather than measured up to the node behind it.
 * @param text - The text to read.
 * @param index - The index to read from.
 * @returns The whitespace and comments standing there, empty where neither does.
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
 * Gets the run of whitespace a string has in front of an index.
 * @param text - The text to read.
 * @param index - The index to read up to.
 * @returns The whitespace standing there, empty where none does.
 */
function trailingWhitespace (text: string, index: number): string {
	let match = TRAILING_WHITESPACE_RUN.exec(text.slice(0, index))

	return match ? match[0] : ``
}

/**
 * Gets the node standing at the beginning of a container's contents, walking down through the selectors it is nested in.
 * @param node - The container node.
 * @returns The node, or nothing where the container holds none.
 */
function firstNodeInside (node: Container): Node | undefined {
	let target = node.first

	while (target && target.type === `selector`) target = target.first

	return target
}

/**
 * Gets the node standing at the end of a container's contents, walking down through the selectors it is nested in.
 * @param node - The container node.
 * @returns The node, or nothing where the container holds none.
 */
function lastNodeInside (node: Container): Node | undefined {
	let target = node.last

	while (target && target.type === `selector`) target = target.last

	return target
}

/**
 * Sets the space before a node.
 *
 * A comment beside a node moves the whole run around it — the space, the comment, the space — into `raws.spaces`, and `toString()` prints the raw one whenever it is there. A write to `spaces` alone would land on a field nothing reads, so the raw is trimmed alongside it, keeping the comment where the author put it.
 * @param target - The node to set the space of.
 * @param value - The space value to set.
 */
function setSpaceBefore (target: Node, value: string): void {
	target.spaces.before = value

	let spaces = (target as NodeWithRaws).raws?.spaces

	if (spaces?.before !== undefined) spaces.before = value + spaces.before.replace(LEADING_WHITESPACE_RUN, ``)
}

/**
 * Sets the space after a node.
 *
 * The mirror of `setSpaceBefore`, and the side a comment actually reaches: a trailing comment is folded into the raws of the node in front of it whenever whitespace separates the two, which is what makes the raw the printed one here. With nothing between them it is a node of its own instead, and no raw appears. Nothing ever folds into the raws of a pseudo-class's first node — the parser does write `raws.spaces.before`, but on a combinator with a comment in front of it, never here — so the mirror has no reproducer of its own.
 * @param target - The node to set the space of.
 * @param value - The space value to set.
 */
function setSpaceAfter (target: Node, value: string): void {
	target.spaces.after = value

	let spaces = (target as NodeWithRaws).raws?.spaces

	if (spaces?.after !== undefined) spaces.after = spaces.after.replace(TRAILING_WHITESPACE_RUN, ``) + value
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
