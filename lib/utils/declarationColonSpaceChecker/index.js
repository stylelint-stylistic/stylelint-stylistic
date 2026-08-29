import styleSearch from "style-search"
import stylelint from "stylelint"

import { declarationColonSource } from "../declarationColonSource/index.js"
import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { isStandardSyntaxDeclaration } from "../isStandardSyntaxDeclaration/index.js"

let { utils: { report } } = stylelint

/**
 * A function that checks whitespace at a specific location.
 * @typedef {(args: { source: string, index: number, lineCheckStr: string, err: (message: string) => void }) => void} LocationChecker
 */

/**
 * Checks whitespace around colons in declarations.
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: LocationChecker,
 *   fix?: ((decl: import('postcss').Declaration, index: number) => void),
 *   isFixable?: ((decl: import('postcss').Declaration, index: number) => boolean),
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 * }} opts - The options object.
 */
export function declarationColonSpaceChecker (opts) {
	let { fix } = opts

	opts.root.walkDecls((decl) => {
		if (!isStandardSyntaxDeclaration(decl)) return

		// A declaration the parser did not build has no text between its property and its value for either rule to read: PostCSS prints a colon and a space in place of the raw it lacks, and `declarationValueIndex` counts a colon alone, so the two disagree by the very character these rules are about. No syntax this plugin reads through leaves that raw empty; a declaration another plugin's fix built and put in the tree does.
		if (!decl.raws.between) return

		// The declaration down to the end of its value, as the file prints it: whatever the shape of that value, the run standing behind the colon is in this text wherever the declaration keeps it.
		let source = declarationColonSource(decl)

		// The declaration's own colon is the one PostCSS filed in `raws.between`, that raw holding everything the file spells between the property and the value, so the search is over that raw's span and no further.
		// A colon standing anywhere else opens no declaration: the value may spell one, a data URI's, and the property may spell one of its own, an escaped `\:`, and reading either as the declaration's sends the check and the fix to a character they are not about.
		// Inside that span the search is still the comment-aware one, since the comments standing in front of the colon are the raw's own text and may hold a colon apiece, an URL's for one.
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/408
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/421
		let betweenStart = declarationValueIndex(decl) - decl.raws.between.length

		styleSearch({ source: source.slice(betweenStart, declarationValueIndex(decl)), target: `:`, once: true }, ({ startIndex: indexInBetween }) => {
			// The search read a span of the declaration's text, and everything downstream counts from the start of the whole of it
			let startIndex = betweenStart + indexInBetween
			let problemIndex = decl.prop.toString().length + 1
			// A rule may know that this particular problem cannot be fixed without breaking the code
			let isFixable = fix && (!opts.isFixable || opts.isFixable(decl, startIndex))

			opts.locationChecker({
				source,
				index: startIndex,
				lineCheckStr: decl.value,
				err: (message) => {
					report({
						message,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result: opts.result,
						ruleName: opts.checkedRuleName,
						fix: fix && isFixable ? () => fix(decl, startIndex) : undefined,
					})
				},
			})
		})
	})
}
