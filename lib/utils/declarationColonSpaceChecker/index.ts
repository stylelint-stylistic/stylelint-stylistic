import type { Declaration, Root } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { declarationColonSource } from "../declarationColonSource/index.ts"
import { declarationValueAsSpelled } from "../declarationValueAsSpelled/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"

let { utils: { report } } = stylelint

/** Checks the whitespace at one index. */
export type LocationChecker = (args: {
	source: string,
	index: number,
	lineCheckStr: string,
	err: (message: string) => void,
}) => void

/**
 * Checks the whitespace beside the colon of every declaration.
 * @param opts - The options.
 */
export function declarationColonSpaceChecker (opts: {
	root: Root,
	locationChecker: LocationChecker,
	fix?: ((decl: Declaration, index: number) => void),
	isChecked?: ((decl: Declaration) => boolean),
	isFixable?: ((decl: Declaration, index: number) => boolean),
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,
}): void {
	let { fix } = opts

	opts.root.walkDecls((decl) => {
		if (!opts.syntax.isStandardDeclaration(decl)) return

		// Another plugin's declaration has no `raws.between`
		if (!decl.raws.between) return

		// The rule's own filter
		if (opts.isChecked && !opts.isChecked(decl)) return

		let source = declarationColonSource(opts.syntax, decl, opts.result)

		// The first colon of `raws.between` outside a comment, string or parentheses (#92, #408, #421)
		let indexInBetween = colonIndexInBetween(opts.syntax, decl, opts.result)

		if (indexInBetween === -1) return

		// Counted from the start of the declaration
		let startIndex = declarationValueIndex(decl) - decl.raws.between.length + indexInBetween
		let problemIndex = decl.prop.toString().length + 1
		// The rule's own fix guard
		let isFixable = fix && (!opts.isFixable || opts.isFixable(decl, startIndex))

		opts.locationChecker({
			source,
			index: startIndex,
			// `decl.value` drops comments, and a break inside one with them (#389)
			lineCheckStr: declarationValueAsSpelled(opts.syntax, decl, opts.result),
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
