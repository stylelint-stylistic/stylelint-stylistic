import type { Root, Rule } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import type { SelectorCopies, Syntax } from "../../syntaxes/index.ts"
import type { InlineComment } from "../findSelectorInlineComments/index.ts"

let { utils: { report } } = stylelint

export interface SelectorListCommaWhitespaceCheckerOptions {

	/** The PostCSS root node. */
	root: Root,

	/** The Stylelint result. */
	result: PostcssResult,

	/** The syntax the rule is built over. */
	syntax: Syntax,

	/** The location checker function. */
	locationChecker: (opts: {
		source: string,
		index: number,
		err: (msg: string) => void,
	}) => void,

	/** The name of the rule being checked. */
	checkedRuleName: string,

	/** The fix function. */
	fix?: ((rule: Rule, index: number) => void),

	/** Tells whether this particular problem can be fixed. Stylelint counts a fixer as applied whatever it does, so a rule that cannot repair a problem has to say so here rather than from inside the fixer. */
	isFixable?: ((selector: string, index: number, inlineComments: InlineComment[]) => boolean),
}

/**
 * Checks whitespace around commas in selector lists.
 * @param opts - The options object.
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
	 * Checks whitespace around a delimiter and reports violations.
	 * @param source - The source string being checked.
	 * @param index - The index of the delimiter.
	 * @param node - The rule node.
	 * @param copies - The selector, opened by the syntax.
	 */
	function checkDelimiter (source: string, index: number, node: Rule, copies: SelectorCopies): void {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				// A rule may know that this particular problem cannot be fixed without breaking the code. The decision has to be made before the report, since Stylelint counts a fixer as applied whatever it does.
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
