import type { Node, Root } from "postcss"
import type { Combinator, Node as SelectorParserNode } from "postcss-selector-parser"
import stylelint, { type PostcssResult } from "stylelint"

import { WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { parseSelector } from "../parseSelector/index.ts"

let { utils: { report } } = stylelint

/** A function that checks whitespace at a specific location. */
export type LocationChecker = (args: {
	source: string,
	index: number,
	errTarget: string,
	err: (message: string) => void,
}) => void

/**
 * Gets the closest preceding sibling that is not a comment.
 * @param node - The node to start from.
 * @returns The node, or nothing if the node is preceded by comments only.
 */
function prevNonComment (node: SelectorParserNode): SelectorParserNode | undefined {
	let prev = node.prev()

	while (prev && prev.type === `comment`) prev = prev.prev()

	return prev
}

/**
 * Checks whitespace around selector combinators.
 * @param opts - The options object.
 */
export function selectorCombinatorSpaceChecker (opts: {
	root: Root,
	result: PostcssResult,
	syntax: Syntax,
	locationChecker: LocationChecker,
	locationType: `before` | `after`,
	checkedRuleName: string,
	fix?: ((combinator: Combinator) => void),
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

		selectorTree.walkCombinators((node) => {
			// Ignore non-standard combinators
			if (!opts.syntax.isStandardCombinator(node)) return

			// Ignore spaced descendant combinator
			if (WHITESPACE.test(node.value)) return

			// A selector may open with a combinator, as nesting syntax spells one, and then there is nothing in front of it to measure the whitespace against. A comment does not open a selector, so it does not count as such a thing either.
			if (opts.locationType === `before` && !prevNonComment(node)) return

			let parentParentNode = node.parent && node.parent.parent

			// Ignore pseudo-classes selector like `.foo:nth-child(2n + 1) {}`
			if (parentParentNode && parentParentNode.type === `pseudo`) return

			let sourceIndex = node.sourceIndex
			let index = node.value.length > 1 && opts.locationType === `before` ? sourceIndex : sourceIndex + node.value.length - 1

			check(selector, node, index, rule, copies.toSourceIndex(sourceIndex))
		})

		if (hasFixed) {
			let fixedSelector = String(selectorTree)

			copies.write(fixedSelector)
		}
	})

	/**
	 * Checks a combinator for whitespace violations.
	 * @param source - The source string.
	 * @param combinator - The combinator node.
	 * @param index - The index to check.
	 * @param node - The parent node.
	 * @param reportIndex - The index of the combinator in the source of the parent node.
	 */
	function check (source: string, combinator: Combinator, index: number, node: Node, reportIndex: number): void {
		// A comment standing beside a combinator is folded into the raws of that side, and a raw is what the parser prints in place of the spaces the fix writes. Stylelint counts a fixer as applied whatever it does, so a write nothing would print has to be declined here rather than from inside the fixer, or the warning goes down with it and `--fix` reports a clean pass on a file it has not touched.
		let isFixable = fix && combinator.raws?.spaces?.[opts.locationType] === undefined

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
