import type { Combinator, Root } from "postcss-selector-parser"
import stylelint from "stylelint"

import { LEADING_WHITESPACE_AND_REST, WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { InlineComment } from "../../syntaxes/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findSelectorBlockComments } from "../../utils/findSelectorBlockComments/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `selector-descendant-combinator-no-non-space`

const MESSAGES = defineMessages({
	rejected: (nonSpaceCharacter) => `Unexpected "${nonSpaceCharacter}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/**
 * Disallows non-space characters for descendant combinators of selectors.
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
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!syntax.isStandardRule(ruleNode)) return

			let hasFixed = false

			let copies = syntax.selectorCopies(ruleNode)

			let { selector } = copies

			let fullSelector = parseSelector(selector, result, ruleNode)

			if (!fullSelector) return

			// Skipped where the tree does not print the source back, since message, index and fix are measured against it.
			if (!standsForSource(fullSelector, selector)) return

			fullSelector.walkCombinators((combinatorNode) => {
				// A descendant combinator is `" "`, surplus in `spaces.before` or `raws.value`; other whitespace in `value` is what this rule reports.
				let isDescendant = combinatorNode.value === ` `

				if (!isDescendant && !WHITESPACE.test(combinatorNode.value)) return

				// The node's whole text, whitespace included; `sourceIndex` is where it begins.
				let text = combinatorNode.toString()

				if (!isDescendant) {
					// No fix could make this valid; the message reads the text back out of the source copy.
					report({
						result,
						ruleName,
						message: messages.rejected,
						messageArgs: [copies.sourceSpelling(text, combinatorNode.sourceIndex)],
						node: ruleNode,
						index: copies.toSourceIndex(combinatorNode.sourceIndex),
						endIndex: copies.toSourceIndex(combinatorNode.sourceIndex),
					})

					return
				}

				// A comment splits a combinator's run and the parser reads the rest as a descendant combinator; `.foo > /*c*/  .bar` is a child combinator alone.
				if (isLeftOverOfCombinator(combinatorNode)) return

				// Whitespace is measured between the comments, each stretch reported and collapsed on its own.
				let segments = splitAtComments(text, combinatorNode.sourceIndex, copies.comments)

				// The whole run goes into the raw value and the split spaces are emptied, the parser's own shape for it.
				function write (): void {
					combinatorNode.spaces.before = ``
					combinatorNode.spaces.after = ``
					combinatorNode.raws = { ...combinatorNode.raws, spaces: {}, value: segments.map((segment) => segment.value).join(``) }
				}

				/**
				 * Reports a run that is not a single space.
				 * @param segment - The run, as {@link splitAtComments} cut it.
				 */
				function reportRun (segment: {
					value: string,
					index: number,
					isComment: boolean,
					closesInlineComment: boolean,
				}): void {
					// A single space is what the rule asks for; an empty run is a comment abutting the selector.
					if (segment.isComment || segment.value === ` ` || segment.value === ``) return

					// The break in this run closes a `//` comment, which a single space would not, so the run is skipped.
					if (segment.closesInlineComment) return

					let index = copies.toSourceIndex(segment.index)

					report({
						result,
						ruleName,
						message: messages.rejected,
						messageArgs: [segment.value],
						node: ruleNode,
						index,
						endIndex: index,
						fix: (): void => {
							hasFixed = true
							segment.value = ` `
							write()
						},
					})
				}

				for (let segment of segments) reportRun(segment)
			})

			if (hasFixed) {
				let fixedSelector = String(fullSelector)

				copies.write(fixedSelector)
			}
		})
	}
}

/**
 * Tells whether a parsed selector prints the source back, after restoring the text the parser moved.
 *
 * A parenthesised group where a combinator belongs is read as a combinator whose value is the whitespace in front plus the group, a comment between the two moved into `raws.spaces.after`: `.foo /*c*\/\t( )\t.bar` prints as `.foo ( )/*c*\/\t\t.bar`. The node gets the three back where the file holds them at its index.
 * @param selectorTree - The parsed selector.
 * @param selector - The source.
 * @returns True if the tree prints the source.
 */
function standsForSource (selectorTree: Root, selector: string): boolean {
	if (String(selectorTree) === selector) return true

	selectorTree.walkCombinators((combinatorNode) => {
		if (selector.startsWith(String(combinatorNode), combinatorNode.sourceIndex)) return

		let moved = combinatorNode.raws?.spaces?.after

		if (moved === undefined) return

		// The two groups may be empty, so the pattern matches every text
		let [, whitespace, group] = LEADING_WHITESPACE_AND_REST.exec(combinatorNode.raws?.value ?? combinatorNode.value) as RegExpExecArray
		let text = whitespace + moved + group

		if (!selector.startsWith(text, combinatorNode.sourceIndex)) return

		combinatorNode.spaces.after = ``
		combinatorNode.raws = { ...combinatorNode.raws, spaces: { ...combinatorNode.raws?.spaces, after: `` }, value: text }
	})

	return String(selectorTree) === selector
}

/**
 * Tells whether a combinator node is whitespace a comment split off the combinator in front; a run without a comment stays whole.
 * @param node - The combinator.
 * @returns True if only comments separate it from a combinator.
 */
function isLeftOverOfCombinator (node: Combinator): boolean {
	let previous = node.prev()

	if (!previous || previous.type !== `comment`) return false

	while (previous && previous.type === `comment`) previous = previous.prev()

	return previous !== undefined && previous.type === `combinator`
}

/**
 * Splits selector text into its comments and the runs between them.
 *
 * Runs come first and last, empty at a comment, so joining the segments gives the text back. The run behind a `//` comment is marked: its break closes the comment, and a fix may not write over it.
 * @param text - The stretch of selector to split.
 * @param offset - Where the text begins in the selector.
 * @param inlineComments - The selector's inline comments.
 * @returns The segments in order.
 */
function splitAtComments (text: string, offset: number, inlineComments: InlineComment[]): Array<{
	value: string,
	index: number,
	isComment: boolean,
	closesInlineComment: boolean,
}> {
	let comments = inlineComments
		.filter((inlineComment) => inlineComment.startIndex < offset + text.length && offset < inlineComment.endIndex)
		.map((inlineComment) => ({ start: Math.max(inlineComment.startIndex - offset, 0), end: Math.min(inlineComment.endIndex - offset, text.length), isInline: true }))

	for (let { start, end } of findSelectorBlockComments(text)) {
		if (!comments.some((comment) => comment.start <= start && end <= comment.end)) comments.push({ start, end, isInline: false })
	}

	let segments = []
	let readUpTo = 0
	let closesInlineComment = false

	for (let comment of comments.toSorted((a, b) => a.start - b.start)) {
		segments.push(
			{ value: text.slice(readUpTo, comment.start), index: offset + readUpTo, isComment: false, closesInlineComment },
			{ value: text.slice(comment.start, comment.end), index: offset + comment.start, isComment: true, closesInlineComment: false },
		)
		readUpTo = comment.end
		closesInlineComment = comment.isInline
	}

	segments.push({ value: text.slice(readUpTo), index: offset + readUpTo, isComment: false, closesInlineComment })

	return segments
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
