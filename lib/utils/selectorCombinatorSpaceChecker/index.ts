import type { Node, Root } from "postcss"
import type { Combinator, Node as SelectorParserNode } from "postcss-selector-parser"
import stylelint, { type PostcssResult } from "stylelint"

import { WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { parseSelector } from "../parseSelector/index.ts"
import { selectorSearchCopy } from "../selectorSearchCopy/index.ts"

let { utils: { report } } = stylelint

/** Checks whitespace at one location. */
export type LocationChecker = (args: {
	source: string,
	index: number,
	errTarget: string,
	err: (message: string) => void,
}) => void

/**
 * The nearest preceding non-comment sibling.
 * @param node - The selector node whose earlier sibling is sought.
 * @returns The sibling, or nothing.
 */
function prevNonComment (node: SelectorParserNode): SelectorParserNode | undefined {
	let prev = node.prev()

	while (prev && prev.type === `comment`) prev = prev.prev()

	return prev
}

/**
 * Checks whitespace around selector combinators.
 * @param opts - The options.
 */
export function selectorCombinatorSpaceChecker (opts: {
	root: Root,
	result: PostcssResult,
	syntax: Syntax,
	locationChecker: LocationChecker,
	locationType: `before` | `after`,
	checkedRuleName: string,
	fix?: ((combinator: Combinator) => void),
	isFixable?: ((selector: string, index: number, runString: string) => boolean),
}): void {
	let { fix } = opts
	let hasFixed

	opts.root.walkRules((rule) => {
		if (!opts.syntax.isStandardRule(rule)) return

		hasFixed = false

		let copies = opts.syntax.selectorCopies(rule)
		let { selector } = copies

		let selectorTree = parseSelector(selector, opts.result, rule)

		if (!selectorTree) return

		// The parser reads an escaped space as a character of its name, so the fix writes the combinator's own spaces alone; the check reads the run over the copy where it is none either (1789661964)
		let { runString } = selectorSearchCopy(selector)

		selectorTree.walkCombinators((node) => {
			// Non-standard
			if (!opts.syntax.isStandardCombinator(node)) return

			// Spaced descendant
			if (WHITESPACE.test(node.value)) return

			// A nesting selector may open with a combinator, and a comment in front does not count
			if (opts.locationType === `before` && !prevNonComment(node)) return

			let parentParentNode = node.parent && node.parent.parent

			// Inside a pseudo-class, as in `:nth-child(2n + 1)`
			if (parentParentNode && parentParentNode.type === `pseudo`) return

			let sourceIndex = node.sourceIndex
			let index = node.value.length > 1 && opts.locationType === `before` ? sourceIndex : sourceIndex + node.value.length - 1

			check(selector, runString, node, index, rule, copies.toSourceIndex(sourceIndex))
		})

		if (hasFixed) {
			let fixedSelector = String(selectorTree)

			copies.write(fixedSelector)
		}
	})

	/**
	 * Checks a combinator.
	 * @param selector - The parseable copy of the selector, which the index counts in.
	 * @param source - The copy of the selector the run is read over.
	 * @param combinator - The parsed combinator node whose whitespace is checked.
	 * @param index - The index to check.
	 * @param node - The rule.
	 * @param reportIndex - The combinator's index in the rule's source.
	 */
	function check (selector: string, source: string, combinator: Combinator, index: number, node: Node, reportIndex: number): void {
		// A comment beside a combinator folds into that side's raws, printed over the spaces the fix writes; declined here, since a fixer doing nothing still counts as applied and eats the warning. The rule's own guard is asked last
		let isFixable = fix && combinator.raws?.spaces?.[opts.locationType] === undefined && (!opts.isFixable || opts.isFixable(selector, index, source))

		opts.locationChecker({
			source,
			index,
			errTarget: combinator.value,
			err: (message) => {
				report({
					message,
					node,
					index: reportIndex,
					endIndex: reportIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					...(fix && isFixable && {
						fix: (): void => {
							hasFixed = true

							fix(combinator)
						},
					}),
				})
			},
		})
	}
}
