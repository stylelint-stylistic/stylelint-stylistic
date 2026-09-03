import type { Declaration, Root } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { declarationColonSource } from "../declarationColonSource/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"

let { utils: { report } } = stylelint

/** A function that checks whitespace at a specific location. */
export type LocationChecker = (args: {
	source: string,
	index: number,
	lineCheckStr: string,
	err: (message: string) => void,
}) => void

/**
 * Checks whitespace around colons in declarations.
 * @param opts - The options object.
 */
export function declarationColonSpaceChecker (opts: {
	root: Root,
	locationChecker: LocationChecker,
	fix?: ((decl: Declaration, index: number) => void),
	isFixable?: ((decl: Declaration, index: number) => boolean),
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,
}): void {
	let { fix } = opts

	opts.root.walkDecls((decl) => {
		if (!opts.syntax.isStandardDeclaration(decl)) return

		// A declaration the parser did not build has no text between its property and its value for either rule to read: PostCSS prints a colon and a space in place of the raw it lacks, and `declarationValueIndex` counts a colon alone, so the two disagree by the very character these rules are about. No syntax this plugin reads through leaves that raw empty; a declaration another plugin's fix built and put in the tree does.
		if (!decl.raws.between) return

		// The declaration down to the end of its value, as the file prints it, and behind that whatever run ran on past the declaration: whatever the shape of the value, the run standing behind the colon is in this text wherever the file keeps it.
		let source = declarationColonSource(opts.syntax, decl, opts.result)

		// The declaration's own colon is the one PostCSS filed in `raws.between`, that raw holding everything the file spells between the property and the value, so the search is over that raw and no further.
		// A colon standing anywhere else opens no declaration: the value may spell one, a data URI's, and the property may spell one of its own, an escaped `\:`, and reading either as the declaration's sends the check and the fix to a character they are not about.
		// Inside that raw the colon is the first one the parser read as a colon rather than as text, since the comments, strings and parenthesised groups standing in front of it are the raw's own text and may hold a colon apiece, a URL's for one.
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/408
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/421
		let indexInBetween = colonIndexInBetween(opts.syntax, decl, opts.result)

		if (indexInBetween === -1) return

		// The colon was found in a span of the declaration's text, and everything downstream counts from the start of the whole of it
		let startIndex = declarationValueIndex(decl) - decl.raws.between.length + indexInBetween
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
					...(fix && isFixable && { fix: (): void => fix(decl, startIndex) }),
				})
			},
		})
	})
}
