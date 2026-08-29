import styleSearch from "style-search"
import stylelint from "stylelint"

import { findSelectorInlineComments } from "../findSelectorInlineComments/index.js"
import { isStandardSyntaxRule } from "../isStandardSyntaxRule/index.js"
import { toSelectorSourceIndex } from "../toSelectorSourceIndex/index.js"

let { utils: { report } } = stylelint

/**
 * @typedef {Object} SelectorListCommaWhitespaceCheckerOptions
 * @property {import('postcss').Root} root - The PostCSS root node.
 * @property {import('stylelint').PostcssResult} result - The Stylelint result.
 * @property {(opts: { source: string, index: number, err: (msg: string) => void }) => void} locationChecker - The location checker function.
 * @property {string} checkedRuleName - The name of the rule being checked.
 * @property {((rule: import('postcss').Rule, index: number) => void)} [fix] - The fix function.
 * @property {((selector: string, index: number, inlineComments: import('../findSelectorInlineComments/index.js').InlineComment[]) => boolean)} [isFixable] - Tells whether this particular problem can be fixed. Stylelint counts a fixer as applied whatever it does, so a rule that cannot repair a problem has to say so here rather than from inside the fixer.
 */

/**
 * Checks whitespace around commas in selector lists.
 * @param {SelectorListCommaWhitespaceCheckerOptions} opts - The options object.
 * @returns {void}
 */
export function selectorListCommaWhitespaceChecker (opts) {
	let { fix } = opts

	opts.root.walkRules((rule) => {
		if (!isStandardSyntaxRule(rule)) return

		/** @type {import('../typeGuards/index.js').SyntaxRaw | undefined} */
		let selectorRaws = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector

		// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw read here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw, reported in the file's own coordinates, and handed to the rule's fixer as the raw spells it, since the raw is the copy the rule slices.
		let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

		styleSearch(
			{
				source: selector,
				target: `,`,
				functionArguments: `skip`,
			},
			(match) => {
				checkDelimiter(selector, match.startIndex, rule, inlineComments)
			},
		)
	})

	/**
	 * Checks whitespace around a delimiter and reports violations.
	 * @param {string} source - The source string being checked.
	 * @param {number} index - The index of the delimiter.
	 * @param {import('postcss').Rule} node - The rule node.
	 * @param {import('../findSelectorInlineComments/index.js').InlineComment[]} inlineComments - The inline comments of the selector.
	 * @returns {void}
	 */
	function checkDelimiter (source, index, node, inlineComments) {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				// A rule may know that this particular problem cannot be fixed without breaking the code. The decision has to be made before the report, since Stylelint counts a fixer as applied whatever it does.
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, inlineComments))
				let sourceIndex = toSelectorSourceIndex(index, inlineComments)

				report({
					message,
					node,
					index: sourceIndex,
					endIndex: sourceIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: fix && isFixable ? () => fix(node, index) : undefined,
				})
			},
		})
	}
}
