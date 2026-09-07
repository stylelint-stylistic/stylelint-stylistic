import type { Declaration, Root } from "postcss"
import styleSearch, { type StyleSearchMatch } from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { declarationString } from "../declarationString/index.ts"

let { utils: { report } } = stylelint

export interface ValueListCommaWhitespaceCheckerOptions {

	/** The root. */
	root: Root,

	/** The result. */
	result: PostcssResult,

	/** The syntax. */
	syntax: Syntax,

	/** Reads the whitespace at an index and reports through `err`. */
	locationChecker: (opts: {
		source: string,
		index: number,
		err: (msg: string) => void,
	}) => void,

	/** The rule's name. */
	checkedRuleName: string,

	/** Fixes the comma at an index. */
	fix?: ((node: Declaration, index: number) => void),

	/** Whether a problem can be fixed; the printed declaration comes along. */
	isFixable?: ((node: Declaration, index: number, declString: string) => boolean),

	/** Moves the index a comma is checked at, or refuses it with `false`. */
	determineIndex?: ((declString: string, match: StyleSearchMatch) => number | false),
}

/**
 * Checks whitespace around the commas of value lists.
 * @param opts - The options.
 */
export function valueListCommaWhitespaceChecker (opts: ValueListCommaWhitespaceCheckerOptions): void {
	let { fix } = opts

	opts.root.walkDecls((decl) => {
		if (!opts.syntax.isStandardDeclaration(decl) || !opts.syntax.isStandardProperty(decl.prop)) return

		let declString = declarationString(opts.syntax, decl)
		let { searchString } = opts.syntax.searchCopy(declString, decl, opts.result)

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
	 * Checks one comma.
	 * @param source - The declaration text.
	 * @param index - The comma's index.
	 * @param node - The declaration.
	 */
	function checkComma (source: string, index: number, node: Declaration): void {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				// Stylelint counts a fixer as applied whatever it does, so the decision is made before the report; here, not before the check, so a clean declaration is not read once per comma.
				let isFixable = fix && (!opts.isFixable || opts.isFixable(node, index, source))

				report({
					message,
					node,
					index,
					endIndex: index,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					...(fix && isFixable && { fix: (): void => fix(node, index) }),
				})
			},
		})
	}
}
