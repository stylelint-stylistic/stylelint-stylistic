import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { findSelectorBlockComments } from "../../utils/findSelectorBlockComments/index.js"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.js"
import { parseSelector } from "../../utils/parseSelector/index.js"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.js"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `selector-descendant-combinator-no-non-space`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	rejected: (nonSpaceCharacter) => `Unexpected "${nonSpaceCharacter}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) return

			let hasFixed = false
			let selectorRaws = ruleNode.raws.selector

			let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

			// `postcss-scss` rewrites every inline comment of a selector into a block comment in
			// the raw parsed here, keeps the source spelling beside it and prints that one, so the
			// two strings drift apart by two characters per comment. Every position is counted in
			// the raw and reported in the file's own coordinates, and a fix is written to both.
			let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

			let fixedSelector = parseSelector(selector, result, ruleNode, (fullSelector) => {
				// A parenthesised group standing where a combinator belongs is nothing the parser
				// has a place for, and a comment in front of one is filed behind it instead, so
				// that `.foo /*c*/\t( )\t.bar` comes back out as `.foo ( )/*c*/\t\t.bar`. Every
				// answer this rule has about such a selector — the text of the warning, the
				// position it stands at, the selector a fix would write back — is measured against
				// a rendering that is not the file. So a selector the parser does not give back as
				// it took it is passed over, which is #159. Everything below rests on that: the
				// text of a node stands in the file where its `sourceIndex` says it does.
				if (String(fullSelector) !== selector) return

				fullSelector.walkCombinators((combinatorNode) => {
					// Every combinator CSS defines keeps its whitespace beside `value` rather than
					// in it — `>`, `+`, `~` and `||`, and the legacy `>>>` and `/deep/` too. A
					// descendant combinator is `" "`, with any surplus in `spaces.before`, or in
					// `raws.value` where the run does not end in a literal space. So a `value` that
					// holds whitespace and yet is not a single space is one of the things CSS has
					// no combinator for, and saying so is what this rule is for.
					let isDescendant = combinatorNode.value === ` `

					if (!isDescendant && !(/\s/u).test(combinatorNode.value)) return

					// `toString()` is the whole text the node stands for, the whitespace it was split
					// across included, and `sourceIndex` is where that text begins in the selector.
					let text = combinatorNode.toString()

					if (!isDescendant) {
						// Nothing this rule could write would turn what CSS has no combinator for into
						// something valid, so the problem is reported and the code left as it was.
						report({
							result,
							ruleName,
							message: messages.rejected,
							messageArgs: [text],
							node: ruleNode,
							index: toSelectorSourceIndex(combinatorNode.sourceIndex, inlineComments),
							endIndex: toSelectorSourceIndex(combinatorNode.sourceIndex, inlineComments),
						})

						return
					}

					// A comment breaks the run of a combinator in two, and the parser reads the
					// whitespace left over on the far side as a descendant combinator of its own.
					// There is no descendant relation there — `.foo > /*c*/  .bar` is a child
					// combinator and nothing else — so such a node is passed over. It takes a
					// comment to split the run: without one the parser keeps the whole of it in the
					// combinator itself, surplus whitespace and all.
					if (isLeftOverOfCombinator(combinatorNode)) return

					// A descendant combinator, on the other hand, keeps whatever comments stand
					// inside it, and they are what the whitespace has to be measured between: each
					// stretch of it is a run of its own, reported at its own position and collapsed
					// on its own, so that every comment stays where the author put it.
					let segments = splitAtComments(text, combinatorNode.sourceIndex, inlineComments)

					// The combinator prints its raw value where it has one, so writing the whole run
					// there — and emptying the spaces the parser had split it across — is what makes
					// a collapsed run reach the output. It is the shape the parser itself gives a
					// combinator whose text does not come apart into whitespace and a single space.
					function write () {
						combinatorNode.spaces.before = ``
						combinatorNode.spaces.after = ``
						combinatorNode.raws = { ...combinatorNode.raws, spaces: {}, value: segments.map((segment) => segment.value).join(``) }
					}

					function reportRun (segment) {
						// A run already a single space is what the rule asks for, and an empty one —
						// a comment abutting the selector beside it — has no whitespace to complain of.
						if (segment.isComment || segment.value === ` ` || segment.value === ``) return

						// An inline comment ends with the line break standing behind it, and that break
						// is in this run. A single space would close no comment, so there is nothing
						// this rule could ask for here and nothing it could write: the run is passed
						// over, as the whitespace behind a combinator of another kind is.
						if (segment.closesInlineComment) return

						let index = toSelectorSourceIndex(segment.index, inlineComments)

						report({
							result,
							ruleName,
							message: messages.rejected,
							messageArgs: [segment.value],
							node: ruleNode,
							index,
							endIndex: index,
							fix: () => {
								hasFixed = true
								segment.value = ` `
								write()
							},
						})
					}

					for (let segment of segments) reportRun(segment)
				})
			})

			if (hasFixed && fixedSelector) {
				if (selectorRaws) {
					selectorRaws.raw = fixedSelector

					// The stringifier reads the copy the source spelled, so the fix has to reach that
					// one as well, with every inline comment spelled the way the file spells it.
					if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, inlineComments)
				}
				else ruleNode.selector = fixedSelector
			}
		})
	}
}

/**
 * Tells whether a combinator node is only what a comment left over of the combinator in
 * front of it, rather than a combinator of its own.
 *
 * The comment is what the answer turns on: a run the parser split at one carries on in a
 * node of its own, while a run with no comment in it stays whole however wide it is. So a
 * combinator standing right behind this one, with nothing but comments between them, is
 * the combinator this whitespace belongs to.
 * @param {import('postcss-selector-parser').Combinator} node - The combinator to look back from.
 * @returns {boolean} True if a comment separates this node from a combinator in front of it.
 */
function isLeftOverOfCombinator (node) {
	let previous = node.prev()

	if (!previous || previous.type !== `comment`) return false

	while (previous && previous.type === `comment`) previous = previous.prev()

	return Boolean(previous) && previous.type === `combinator`
}

/**
 * Splits a stretch of selector text into the comments it holds and the runs between them.
 * The runs come first and last, empty where a comment sits at either end, so that joining
 * every segment gives the text back unchanged.
 *
 * An inline comment is taken whole, however many block comments the raw spells it with, and
 * the run behind one is marked: the line break it holds is what closes that comment, and a
 * fix may not write over it.
 * @param {string} text - The text to split.
 * @param {number} offset - The index the text begins at in the selector.
 * @param {import('../../utils/findSelectorInlineComments/index.js').InlineComment[]} inlineComments - The inline comments of the selector.
 * @returns {Array<{ value: string, index: number, isComment: boolean, closesInlineComment: boolean }>} The segments, in the order they stand in.
 */
function splitAtComments (text, offset, inlineComments) {
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

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
