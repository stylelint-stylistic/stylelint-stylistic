import styleSearch from "style-search"
import stylelint from "stylelint"

import { blankComments } from "../blankComments/index.js"
import { declarationString } from "../declarationString/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findCommentSpans } from "../findCommentSpans/index.js"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.js"
import { isStandardSyntaxDeclaration } from "../isStandardSyntaxDeclaration/index.js"
import { isStandardSyntaxProperty } from "../isStandardSyntaxProperty/index.js"
import { readsInlineComments } from "../readsInlineComments/index.js"

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
		// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells
		// none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence
		// everything standing behind it on the line — the scan is told, rather than asked to find
		// comments and have them taken away afterwards, since what it reads behind such a pair
		// depends on the answer
		let commentSpans = findCommentSpans(declString, endsInlineCommentOnFormFeed(decl), readsInlineComments(decl, opts.result))
		// `style-search` reads the comments of the text for itself, and by rules of its own: an inline
		// comment ends on a line feed and on nothing else, a double slash opens one wherever it stands —
		// the one in `url(http://x/y.png)` among them — and the `*/` closing one block comment and the
		// `/*` opening the next are read as the two slashes of a third. The copy handed to the search has
		// every comment blanked out of it and every false opening spelled out of harm's way, so that none
		// of the three readings is left to make. It is as long as the text and spells it character for
		// character everywhere else, so every position stands where it did, and the checks that follow are
		// made against the text as it stands.
		// The masking is handed no spans because the blanking left it none to guard: every comment is
		// gone from the copy, so every double slash still standing in it opens none
		let searchString = hideFalseInlineComments(blankComments(declString, commentSpans), [])

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
				// A rule may know that this particular problem cannot be fixed without breaking the code.
				// Stylelint counts a fixer as applied whatever it does, so a fixer that declines from the
				// inside takes the warning down with it; the decision has to be made before the report.
				// It is made here rather than in front of the check, so that a declaration whose commas
				// are all in order is not read through once per comma for nothing.
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
