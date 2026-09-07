import type { Root, Rule } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import type { SelectorCopies, Syntax } from "../../syntaxes/index.ts"
import type { InlineComment } from "../../syntaxes/index.ts"

let { utils: { report } } = stylelint

export interface SelectorListCommaWhitespaceCheckerOptions {

	/** The root. */
	root: Root,

	/** The result. */
	result: PostcssResult,

	/** The syntax. */
	syntax: Syntax,

	/** The location checker. */
	locationChecker: (opts: {
		source: string,
		index: number,
		err: (msg: string) => void,
	}) => void,

	/** The rule's name. */
	checkedRuleName: string,

	/** The fix. */
	fix?: ((rule: Rule, index: number) => void),

	/** Whether a problem can be fixed, since Stylelint counts a fixer as applied whatever it does. */
	isFixable?: ((selector: string, index: number, inlineComments: InlineComment[]) => boolean),
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

		styleSearch(
			{
				source: selector,
				target: `,`,
				functionArguments: `skip`,
			},
			(match) => {
				checkDelimiter(selector, match.startIndex, rule, copies)
			},
		)
	})

	/**
	 * Checks whitespace around a delimiter and reports.
	 * @param source - The selector text the delimiter stands in.
	 * @param index - The delimiter's index.
	 * @param node - The rule the warning is reported on.
	 * @param copies - The selector, opened by the syntax.
	 */
	function checkDelimiter (source: string, index: number, node: Rule, copies: SelectorCopies): void {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				// Before the report, since Stylelint counts a fixer as applied whatever it does
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, copies.comments))
				let sourceIndex = copies.toSourceIndex(index)

				report({
					message,
					node,
					index: sourceIndex,
					endIndex: sourceIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					...(fix && isFixable && { fix: (): void => fix(node, index) }),
				})
			},
		})
	}
}
