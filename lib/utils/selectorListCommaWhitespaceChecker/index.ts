import type { Root, Rule } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { findSelectorInlineComments, type InlineComment } from "../findSelectorInlineComments/index.ts"
import { isStandardSyntaxRule } from "../isStandardSyntaxRule/index.ts"
import { toSelectorSourceIndex } from "../toSelectorSourceIndex/index.ts"
import type { SyntaxRaw } from "../typeGuards/index.ts"

let { utils: { report } } = stylelint

export interface SelectorListCommaWhitespaceCheckerOptions {

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
		if (!isStandardSyntaxRule(rule)) return

		let selectorRaws: SyntaxRaw | undefined = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector

		// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw read here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw, reported in the file's own coordinates, and handed to the rule's fixer as the raw spells it, since the raw is the copy the rule slices.
		let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

		styleSearch(
			{
				source: selector,
				target: `,`,
				functionArguments: `skip`,
			},
			(match) => {
				checkDelimiter(selector, match.startIndex, rule, inlineComments)
			},
		)
	})

	/**
	 * Checks whitespace around a delimiter and reports violations.
	 * @param source - The source string being checked.
	 * @param index - The index of the delimiter.
	 * @param node - The rule node.
	 * @param inlineComments - The inline comments of the selector.
	 */
	function checkDelimiter (source: string, index: number, node: Rule, inlineComments: InlineComment[]): void {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				// A rule may know that this particular problem cannot be fixed without breaking the code. The decision has to be made before the report, since Stylelint counts a fixer as applied whatever it does.
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, inlineComments))
				let sourceIndex = toSelectorSourceIndex(index, inlineComments)

				report({
					message,
					node,
					index: sourceIndex,
					endIndex: sourceIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: fix && isFixable ? (): void => fix(node, index) : undefined,
				})
			},
		})
	}
}
