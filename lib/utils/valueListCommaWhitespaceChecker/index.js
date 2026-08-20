import styleSearch from "style-search"
import stylelint from "stylelint"

import { declarationString } from "../declarationString/index.js"
import { isStandardSyntaxDeclaration } from "../isStandardSyntaxDeclaration/index.js"
import { isStandardSyntaxProperty } from "../isStandardSyntaxProperty/index.js"
import { searchCopy } from "../searchCopy/index.js"

let { utils: { report } } = stylelint

/**
 * @typedef {Object} ValueListCommaWhitespaceCheckerOptions.
 * @property {import('postcss').Root} root - The PostCSS root node.
 * @property {import('stylelint').PostcssResult} result - The Stylelint result.
 * @property {(opts: { source: string, index: number, err: (msg: string) => void }) => void} locationChecker - The location checker function
 * @property {string} checkedRuleName - The name of the rule being checked.
 * @property {((node: import('postcss').Declaration, index: number) => void)} [fix] - The fix function.
 * @property {((node: import('postcss').Declaration, index: number, declString: string) => boolean)} [isFixable] - Tells whether this particular problem can be fixed. The declaration comes with it as the checker has already printed it, so that a rule reading the text in front of the comma need not print it again.
 * @property {((declString: string, match: import('style-search').StyleSearchMatch) => number | false)} [determineIndex] - The index determination function.
 */

/**
 * Checks whitespace around commas in value lists.
 * @param {ValueListCommaWhitespaceCheckerOptions} opts - The options object.
 * @returns {void}
 */
export function valueListCommaWhitespaceChecker (opts) {
	opts.root.walkDecls((decl) => {
		if (!isStandardSyntaxDeclaration(decl) || !isStandardSyntaxProperty(decl.prop)) return

		let declString = declarationString(decl)
		let { searchString } = searchCopy(declString, decl, opts.result)

		styleSearch(
			{
				source: searchString,
				target: `,`,
				functionArguments: `skip`,
			},
			(match) => {
				let indexToCheckAfter = opts.determineIndex ? opts.determineIndex(declString, match) : match.startIndex

				if (indexToCheckAfter === false) return

				checkComma(declString, indexToCheckAfter, decl)
			},
		)
	})

	/**
	 * Checks whitespace around a comma and reports violations.
	 * @param {string} source - The source string being checked.
	 * @param {number} index - The index of the comma.
	 * @param {import('postcss').Declaration} node - The declaration node.
	 * @returns {void}
	 */
	function checkComma (source, index, node) {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				// A rule may know that this particular problem cannot be fixed without breaking the code. Stylelint counts a fixer as applied whatever it does, so a fixer that declines from the inside takes the warning down with it; the decision has to be made before the report. It is made here rather than in front of the check, so that a declaration whose commas are all in order is not read through once per comma for nothing.
				let isFixable = opts.fix && (!opts.isFixable || opts.isFixable(node, index, source))

				report({
					message,
					node,
					index,
					endIndex: index,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: isFixable ? () => opts.fix(node, index) : undefined,
				})
			},
		})
	}
}
