import type { Node, Root } from "postcss"
import type { Combinator, Node as SelectorParserNode } from "postcss-selector-parser"
import stylelint, { type PostcssResult } from "stylelint"

import { WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { editKeepsEscapedCharacter } from "../editKeepsEscapedCharacter/index.ts"
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
	fix?: ((index: number, runString: string) => Edit[]),
}): void {
	let { fix } = opts

	opts.root.walkRules((rule) => {
		if (!opts.syntax.isStandardRule(rule)) return

		let copies = opts.syntax.selectorCopies(rule)
		let { selector } = copies

		let selectorTree = parseSelector(selector, opts.result, rule)

		if (!selectorTree) return

		// The parser reads an escaped space as a character of its name, and a backslash in front of a tab as no escape at all, so its spaces hold whitespace the grammar covers with the escape either way; the run is read over the copy where the escapes are masked, and the fix cuts that run out of the selector rather than writing the spaces (1789661964, 1789666655)
		let { runString } = selectorSearchCopy(selector)
		let edits: Edit[] = []

		/**
		 * Checks a combinator.
		 * @param selectorText - The parseable copy of the selector, which the index counts in.
		 * @param source - The copy of the selector the run is read over.
		 * @param combinator - The parsed combinator node whose whitespace is checked.
		 * @param index - The index to check.
		 * @param node - The rule.
		 * @param reportIndex - The combinator's index in the rule's source.
		 */
		function check (selectorText: string, source: string, combinator: Combinator, index: number, node: Node, reportIndex: number): void {
			let combinatorEdits = fix ? fix(index, source) : []
			// A comment beside a combinator folds into that side's raws, and whether the fix may write the run the check read between it and the combinator is unsettled, so the warning stands there (1789857483). A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `b\⏎>c` would come out as `b\>c`, one word, or `b\ >c`, an escaped space, so the warning stands for that too (1789664271)
			let isFixable = fix && combinator.raws?.spaces?.[opts.locationType] === undefined && combinatorEdits.every((edit) => editKeepsEscapedCharacter(selectorText, edit))

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
								edits.push(...combinatorEdits)
							},
						}),
					})
				},
			})
		}

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

		if (edits.length > 0) copies.write(applyEditsFromEnd(selector, edits))
	})
}
