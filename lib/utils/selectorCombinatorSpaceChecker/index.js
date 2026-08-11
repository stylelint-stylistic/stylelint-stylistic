import stylelint from "stylelint"

import { isStandardSyntaxCombinator } from "../isStandardSyntaxCombinator/index.js"
import { isStandardSyntaxRule } from "../isStandardSyntaxRule/index.js"
import { parseSelector } from "../parseSelector/index.js"

let { utils: { report } } = stylelint

/**
 * A function that checks whitespace at a specific location.
 * @typedef {(args: { source: string, index: number, errTarget: string, err: (message: string) => void }) => void} LocationChecker
 */

/**
 * An inline comment of a selector, as both syntaxes spell it.
 * @typedef {{
 *   node: import('postcss-selector-parser').Comment,
 *   value: string,
 *   endIndex: number,
 *   delta: number,
 * }} InlineComment
 */

/**
 * Checks whitespace around selector combinators.
 * @param {{
 *   root: import('postcss').Root,
 *   result: import('stylelint').PostcssResult,
 *   locationChecker: LocationChecker,
 *   locationType: 'before' | 'after',
 *   checkedRuleName: string,
 *   fix: ((combinator: import('postcss-selector-parser').Combinator) => boolean),
 * }} opts - The options object
 * @returns {void}
 */
export function selectorCombinatorSpaceChecker (opts) {
	let hasFixed

	opts.root.walkRules((rule) => {
		if (!isStandardSyntaxRule(rule)) return

		hasFixed = false

		let selectorRaws = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector
		let fixedRawSelector

		let fixedSelector = parseSelector(selector, opts.result, rule, (selectorTree) => {
			let inlineComments = findInlineComments(selectorTree, selectorRaws && selectorRaws.scss)

			selectorTree.walkCombinators((node) => {
				// Ignore non-standard combinators
				if (!isStandardSyntaxCombinator(node)) return

				// Ignore spaced descendant combinator
				if ((/\s/u).test(node.value)) return

				// Check the exist of node in prev of the combinator.
				// in case some that aren't the first begin with combinators (nesting syntax)
				// A comment does not open a selector, so it does not count as such a node either.
				if (opts.locationType === `before` && !prevNonComment(node)) return

				let parentParentNode = node.parent && node.parent.parent

				// Ignore pseudo-classes selector like `.foo:nth-child(2n + 1) {}`
				if (parentParentNode && parentParentNode.type === `pseudo`) return

				let sourceIndex = node.sourceIndex
				let index = node.value.length > 1 && opts.locationType === `before` ? sourceIndex : sourceIndex + node.value.length - 1

				check(selector, node, index, rule, toSourceIndex(sourceIndex, inlineComments))
			})

			if (!hasFixed) return

			fixedRawSelector = String(selectorTree)

			// Give the inline comments their source spelling back, so that the fixed selector
			// suits the field the stringifier reads.
			for (let comment of inlineComments) comment.node.value = comment.value
		})

		if (hasFixed && fixedSelector) {
			if (selectorRaws) {
				selectorRaws.raw = fixedRawSelector

				if (selectorRaws.scss) selectorRaws.scss = fixedSelector
			}
			else rule.selector = fixedSelector
		}
	})

	/**
	 * Checks a combinator for whitespace violations.
	 * @param {string} source - The source string.
	 * @param {import('postcss-selector-parser').Combinator} combinator - The combinator node.
	 * @param {number} index - The index to check.
	 * @param {import('postcss').Node} node - The parent node.
	 * @param {number} reportIndex - The index of the combinator in the source of the parent node.
	 */
	function check (source, combinator, index, node, reportIndex) {
		opts.locationChecker({
			source,
			index,
			errTarget: combinator.value,
			err: (message) => {
				report({
					message,
					node,
					index: reportIndex,
					endIndex: reportIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: opts.fix
						? () => {
							hasFixed = true

							return opts.fix(combinator)
						}
						: undefined,
				})
			},
		})
	}
}

/**
 * Collects the inline comments of a selector, pairing every comment node of the parsed
 * selector with the text it has in the source.
 *
 * `postcss-scss` rewrites every inline comment of a selector into a block comment inside
 * `raws.selector.raw` and keeps the source spelling in `raws.selector.scss`, so the two
 * strings drift apart by two characters per inline comment.
 * @param {import('postcss-selector-parser').Root} selectorTree - The parsed selector.
 * @param {string} [scssSelector] - The source spelling of the selector, if the two differ.
 * @returns {InlineComment[]} The inline comments, in source order.
 */
function findInlineComments (selectorTree, scssSelector) {
	/** @type {InlineComment[]} */
	let inlineComments = []

	if (!scssSelector) return inlineComments

	let delta = 0

	selectorTree.walkComments((node) => {
		let sourceIndex = node.sourceIndex - delta

		// A block comment is spelled the same way in both strings.
		if (!scssSelector.startsWith(`//`, sourceIndex)) return

		let lineBreakIndex = scssSelector.indexOf(`\n`, sourceIndex)
		let value = scssSelector.slice(sourceIndex, lineBreakIndex === -1 ? undefined : lineBreakIndex)

		delta += node.value.length - value.length

		inlineComments.push({ node, value, endIndex: node.sourceIndex + node.value.length, delta })
	})

	return inlineComments
}

/**
 * Gets the closest preceding sibling that is not a comment.
 * @param {import('postcss-selector-parser').Node} node - The node to start from.
 * @returns {import('postcss-selector-parser').Node | undefined} The node, or nothing if the node is preceded by comments only.
 */
function prevNonComment (node) {
	let prev = node.prev()

	while (prev && prev.type === `comment`) prev = prev.prev()

	return prev
}

/**
 * Converts an index of the parsed selector into an index of the source the node is stringified from.
 * @param {number} index - The index in the parsed selector.
 * @param {InlineComment[]} inlineComments - The inline comments of the selector.
 * @returns {number} The index in the source.
 */
function toSourceIndex (index, inlineComments) {
	let delta = 0

	for (let inlineComment of inlineComments) {
		if (inlineComment.endIndex > index) break

		delta = inlineComment.delta
	}

	return index - delta
}
