import type { Root, Rule } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import type { SelectorCopies, Syntax } from "../../syntaxes/index.ts"
import type { InlineComment } from "../../syntaxes/index.ts"
import { rawInFrontOfText } from "../rawInFrontOfText/index.ts"
import { report } from "../report/index.ts"
import { selectorSearchCopy } from "../selectorSearchCopy/index.ts"
import type { WhitespaceChecker } from "../whitespaceChecker/index.ts"

export interface SelectorListCommaWhitespaceCheckerOptions {

	/** The root. */
	root: Root,

	/** The result. */
	result: PostcssResult,

	/** The syntax. */
	syntax: Syntax,

	/** The location checker. */
	locationChecker: WhitespaceChecker,

	/** The rule's name. */
	checkedRuleName: string,

	/** The fix; the copy the runs are read over comes along, so a fix cuts the run the check measured. */
	fix?: ((rule: Rule, index: number, runString: string) => void),

	/** Whether a problem can be fixed, since Stylelint counts a fixer as applied whatever it does; the rule, the comma's index in its source, every comma of the list and the copy the runs are read over come along. */
	isFixable?: ((selector: string, index: number, inlineComments: InlineComment[], rule: Rule, runString: string) => boolean),
}

/**
 * Checks whitespace around commas in selector lists.
 * @param opts - The options.
 */
export function selectorListCommaWhitespaceChecker (opts: SelectorListCommaWhitespaceCheckerOptions): void {
	let { fix } = opts

	opts.root.walkRules((rule) => {
		if (!opts.syntax.isStandardRule(rule)) return

		let copies = opts.syntax.selectorCopies(rule)
		let { selector } = copies

		let textBefore = rawInFrontOfText(rule)
		let commaIndices: number[] = []
		// The search reads a string and an escape by rules of its own, so the commas are found and checked over the copies and reported at the selector's index; the whitespace is read over the second copy, where an escaped space is a character of a name and no run (1789657288)
		let { searchString, runString } = selectorSearchCopy(selector)

		styleSearch(
			{
				source: searchString,
				target: `,`,
				functionArguments: `skip`,
			},
			(match) => {
				commaIndices.push(match.startIndex)
			},
		)

		for (let index of commaIndices) checkDelimiter(selector, runString, index, rule, copies, textBefore)
	})

	/**
	 * Checks whitespace around a delimiter and reports.
	 * @param source - The selector text the delimiter stands in.
	 * @param runString - The copy of it the runs are read over.
	 * @param index - The delimiter's index.
	 * @param node - The rule the warning is reported on.
	 * @param copies - The selector, opened by the syntax.
	 * @param textBefore - What the file holds in front of the selector, where a comma opening it has its run (1789593917).
	 */
	function checkDelimiter (source: string, runString: string, index: number, node: Rule, copies: SelectorCopies, textBefore: string): void {
		opts.locationChecker({
			source: runString,
			index,
			textBefore,
			err: (message) => {
				let sourceIndex = copies.toSourceIndex(index)
				// Before the report, since Stylelint counts a fixer as applied whatever it does
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, copies.comments, node, runString))

				report({
					message,
					node,
					index: sourceIndex,
					endIndex: sourceIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					...(fix && isFixable && { fix: (): void => fix(node, index, runString) }),
				})
			},
		})
	}
}
