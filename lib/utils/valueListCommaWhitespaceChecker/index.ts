import type { Declaration, Root } from "postcss"
import styleSearch, { type StyleSearchMatch } from "style-search"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import type { Edit } from "../applyEditsFromEnd/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { report } from "../report/index.ts"
import { writesKeepingAddresses } from "../writesKeepingAddresses/index.ts"

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

	/** Fixes the comma at an index; the copy the runs are read over comes along, so a fix cuts the run the check measured. */
	fix?: ((node: Declaration, index: number, runString: string) => void),

	/** Whether a problem can be fixed; the printed declaration, the index of every comma checked in it and the copy the runs are read over come along. */
	isFixable?: ((node: Declaration, index: number, declString: string, runString: string) => boolean),

	/** The spans a fix would write, indexed in the printed declaration. Every fix of a declaration is asked along with the others whether the writes switch how the tokenizer reads an address's parentheses ({@link writesKeepingAddresses}), and one they refuse is reported without a fix. */
	edits: ((node: Declaration, index: number, declString: string, runString: string) => Edit[]),

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
		let { searchString, runString } = opts.syntax.searchCopy(declString, decl, opts.result)

		let indices: number[] = []

		styleSearch(
			{
				source: searchString,
				target: `,`,
				functionArguments: `skip`,
			},
			(match) => {
				let indexToCheckAfter = opts.determineIndex ? opts.determineIndex(declString, match) : match.startIndex

				if (indexToCheckAfter === false) return

				indices.push(indexToCheckAfter)
			},
		)

		let problems = indices.flatMap((index) => checkComma(declString, runString, index, decl))
		// Stylelint counts a fixer as applied whatever it does, so which fixes are given is settled before the reports, and together, since the writes of one declaration are asked about as one run
		let given = writesKeepingAddresses(declString, problems, opts.syntax.inlineComments(decl, opts.result), decl, opts.result, opts.checkedRuleName)

		for (let [problemIndex, { message, index }] of problems.entries()) {
			report({
				message,
				node: decl,
				index,
				endIndex: index,
				result: opts.result,
				ruleName: opts.checkedRuleName,
				...(fix && given[problemIndex] && { fix: (): void => fix(decl, index, runString) }),
			})
		}
	})

	/**
	 * Checks one comma. The whitespace is read over the copy with its escapes masked, since an escaped space or the space closing a hexadecimal escape is a character of a word and no run.
	 * @param source - The declaration text.
	 * @param runString - The copy of it the runs are read over.
	 * @param index - The comma's index.
	 * @param node - The declaration.
	 * @returns The problems found, each with the spans its fix would write, or none where a guard refuses the fix.
	 */
	function checkComma (source: string, runString: string, index: number, node: Declaration): { message: string, index: number, edits: Edit[] | undefined }[] {
		let problems: { message: string, index: number, edits: Edit[] | undefined }[] = []

		opts.locationChecker({
			source: runString,
			index,
			err: (message) => {
				// Asked here, not in front of the check, so a clean declaration is not read once per comma
				let isFixable = fix && (!opts.isFixable || opts.isFixable(node, index, source, runString))

				problems.push({ message, index, edits: isFixable ? opts.edits(node, index, source, runString) : undefined })
			},
		})

		return problems
	}
}
