import styleSearch from "style-search"
import stylelint from "stylelint"

import { closeInlineComments } from "../closeInlineComments/index.js"
import { declarationString } from "../declarationString/index.js"
import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"

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
		// `style-search` skips the text of an inline comment, so that no code is read out of one, but it
		// ends such a comment with a line feed and with nothing else. A comment closed by a carriage
		// return would hide the rest of the declaration from it, so the text of every comment is blanked
		// out before the search and the search reads spaces where the comment stood. Every position
		// stays where it was, and the checks that follow are made against the declaration as it stands.
		// `style-search` skips the text of an inline comment, so that no code is read out of one, but it
		// ends such a comment with a line feed and with nothing else. Writing the break that closes each
		// of them as a line feed puts the end of the comment where the syntax puts it, and leaves every
		// position of the copy where it stands in the text itself, so the checks that follow are made
		// against the declaration as it stands.
		let searchString = closeInlineComments(declString, findInlineCommentSpans(declString, endsInlineCommentOnFormFeed(decl)))
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
