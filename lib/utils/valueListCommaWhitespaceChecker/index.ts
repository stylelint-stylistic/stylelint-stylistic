import type { Declaration, Root } from "postcss"
import styleSearch, { type StyleSearchMatch } from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { declarationString } from "../declarationString/index.ts"
import { isStandardSyntaxDeclaration } from "../isStandardSyntaxDeclaration/index.ts"
import { isStandardSyntaxProperty } from "../isStandardSyntaxProperty/index.ts"
import { searchCopy } from "../searchCopy/index.ts"

let { utils: { report } } = stylelint

export interface ValueListCommaWhitespaceCheckerOptions {

	/** The PostCSS root node. */
	root: Root,

	/** The Stylelint result. */
	result: PostcssResult,

	/** The location checker function. */
	locationChecker: (opts: {
		source: string,
		index: number,
		err: (msg: string) => void,
	}) => void,

	/** The name of the rule being checked. */
	checkedRuleName: string,

	/** The fix function. */
	fix?: ((node: Declaration, index: number) => void),

	/** Tells whether this particular problem can be fixed. The declaration comes with it as the checker has already printed it, so that a rule reading the text in front of the comma need not print it again. */
	isFixable?: ((node: Declaration, index: number, declString: string) => boolean),

	/** The index determination function. */
	determineIndex?: ((declString: string, match: StyleSearchMatch) => number | false),
}

/**
 * Checks whitespace around commas in value lists.
 * @param opts - The options object.
 */
export function valueListCommaWhitespaceChecker (opts: ValueListCommaWhitespaceCheckerOptions): void {
	let { fix } = opts

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
	 * @param source - The source string being checked.
	 * @param index - The index of the comma.
	 * @param node - The declaration node.
	 */
	function checkComma (source: string, index: number, node: Declaration): void {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				// A rule may know that this particular problem cannot be fixed without breaking the code. Stylelint counts a fixer as applied whatever it does, so a fixer that declines from the inside takes the warning down with it; the decision has to be made before the report. It is made here rather than in front of the check, so that a declaration whose commas are all in order is not read through once per comma for nothing.
				let isFixable = fix && (!opts.isFixable || opts.isFixable(node, index, source))

				report({
					message,
					node,
					index,
					endIndex: index,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: fix && isFixable ? (): void => fix(node, index) : undefined,
				})
			},
		})
	}
}
