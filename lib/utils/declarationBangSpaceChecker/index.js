import styleSearch from "style-search"
import stylelint from "stylelint"

import { closeInlineComments } from "../closeInlineComments/index.js"
import { declarationString } from "../declarationString/index.js"
import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.js"

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
		let spans = findInlineCommentSpans(declString, endsInlineCommentOnFormFeed(decl))
		// `style-search` reads the inline comments of the declaration for itself, and reads them by two
		// rules of its own: a comment ends on a line feed and on nothing else, and a double slash opens
		// one wherever it stands, the one in `url(http://x/y.png)` among them. A comment closed by a
		// carriage return would therefore hide the rest of the declaration from the search, and an
		// address would hide the flag standing behind it. The copy handed to the search closes each real
		// comment where the syntax closes it and spells every false opening out of harm's way; it is as
		// long as the declaration and spells it character for character everywhere else, so every
		// position stands where it did, and the checks that follow are made against the declaration as
		// it stands.
		let searchString = hideFalseInlineComments(closeInlineComments(declString, spans), spans)
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
