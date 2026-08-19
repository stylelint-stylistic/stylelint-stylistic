import styleSearch from "style-search"
import stylelint from "stylelint"

import { blankComments } from "../blankComments/index.js"
import { declarationString } from "../declarationString/index.js"
import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findCommentSpans } from "../findCommentSpans/index.js"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.js"
import { readsInlineComments } from "../readsInlineComments/index.js"

let { utils: { report } } = stylelint

/** @typedef {import('postcss').Declaration} Declaration */

/**
 * A function that checks whitespace at a specific location.
 * @typedef {(args: { source: string, index: number, err: (message: string) => void }) => void} LocationChecker
 */

/**
 * Checks whitespace around bang operators in declarations.
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: LocationChecker,
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 *   fix: ((decl: Declaration, index: number) => boolean),
 *   isFixable?: ((decl: Declaration, index: number) => boolean),
 * }} opts - The options object
 * @returns {void}
 */
export function declarationBangSpaceChecker (opts) {
	opts.root.walkDecls((decl) => {
		let indexOffset = declarationValueIndex(decl)
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
		let valueString = searchString.slice(indexOffset)

		if (!valueString.includes(`!`)) return

		styleSearch({ source: valueString, target: `!` }, (match) => {
			check(declString, match.startIndex + indexOffset, decl)
		})
	})

	/**
	 * Checks a bang operator for whitespace violations.
	 * @param {string} source - The source string.
	 * @param {number} index - The index to check.
	 * @param {Declaration} decl - The declaration node.
	 */
	function check (source, index, decl) {
		// A rule may know that this particular problem cannot be fixed without breaking the code
		let isFixable = opts.fix && (!opts.isFixable || opts.isFixable(decl, index))

		opts.locationChecker({
			source,
			index,
			err: (message) => {
				report({
					message,
					node: decl,
					index,
					endIndex: index,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: isFixable ? () => opts.fix(decl, index) : undefined,
				})
			},
		})
	}
}
