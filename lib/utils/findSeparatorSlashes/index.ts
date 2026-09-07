import type { AtRule, Declaration } from "postcss"
import valueParser, { type Node as ValueParserNode } from "postcss-value-parser"
import type { PostcssResult } from "stylelint"

import { isMathFunction } from "../../reference/functions.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blankComments } from "../blankComments/index.ts"
import { matchesStringOrRegExp } from "../matchesStringOrRegExp/index.ts"
import { opensAnAddress } from "../opensAnAddress/index.ts"

/** Options of the walk. */
export type SlashOptions = {

	/** Whether to read into a nameless group: a media feature is one; in a value it is preprocessor arithmetic, a Sass list or a custom property's text. */
	readsGroups: boolean,

	/** Calls skipped with their contents. */
	ignoreFunctions?: string | RegExp | (string | RegExp)[] | undefined,
}

/**
 * Where a bare address's token closes, by PostCSS's tokenizer: every `(` and `)` counts, quoted or not, an escaped one does not. `postcss-value-parser` closes it on the first `)` and returns a solidus behind that as a divider ([#548](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/548)).
 * @param text - The text, comments blanked.
 * @param openIndex - The index behind the `(`.
 * @returns The index behind the closing `)`, or the end of the text.
 */
function bareAddressEnd (text: string, openIndex: number): number {
	let depth = 1
	let index = openIndex

	while (index < text.length && depth > 0) {
		let character = text.charAt(index)

		if (character === `\\`) index += 1
		else if (character === `(`) depth += 1
		else if (character === `)`) depth -= 1

		index += 1
	}

	return index
}

/**
 * Finds every solidus separating two parts of a value: a ratio, a font shorthand, a grid area, an alpha.
 *
 * Comments are blanked first ([#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378), [#504](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/504)). Skipped with their contents: a `url()` address, a math function, a call the syntax does not read as one, and a call the options name. A nameless group is read as `readsGroups` says, and the syntax is asked at each solidus whether it is its own operator. The index is the solidus's own, not the `div` node's, which opens at the whitespace in front ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)).
 * @param text - The text, as `Syntax#read` returns it.
 * @param syntax - The syntax asked about groups and operators.
 * @param node - The declaration or at-rule.
 * @param result - The Stylelint result.
 * @param options - What is read into and what is skipped.
 * @returns The index of each separator solidus, in order.
 */
export function findSeparatorSlashes (text: string, syntax: Syntax, node: AtRule | Declaration, result: PostcssResult, options: SlashOptions): number[] {
	let slashes: number[] = []
	let blanked = blankComments(text, syntax.printedComments(node, text, result))

	/**
	 * Walks a list of nodes, into every call that is read.
	 * @param nodes - The value-parser nodes of one level.
	 */
	function walk (nodes: ValueParserNode[]): void {
		// The end of a bare address's token; siblings made of its tail are skipped
		let addressEnd = 0

		for (let [at, valueNode] of nodes.entries()) {
			if (valueNode.sourceIndex < addressEnd) continue

			if (valueNode.type === `div`) {
				let index = valueNode.sourceIndex + valueNode.before.length

				// `//` separates nothing, but the parser returns two dividers for it (#548)
				let pairsWithANeighbour = blanked.charAt(index - 1) === `/` || blanked.charAt(index + 1) === `/`

				if (valueNode.value === `/` && !pairsWithANeighbour && !syntax.readsSlashAsOperator(nodes[at - 1], nodes[at + 1])) slashes.push(index)

				continue
			}

			if (valueNode.type !== `function`) continue

			if (valueNode.value === ``) {
				if (options.readsGroups) walk(valueNode.nodes)

				continue
			}

			if (opensAnAddress(valueNode, at, nodes)) {
				let [address] = valueNode.nodes

				// A quoted address closes on its mark and `)`; a bare one where the tokenizer says
				addressEnd = address?.type === `string` ? valueNode.sourceEndIndex : bareAddressEnd(blanked, valueNode.sourceIndex + valueNode.value.length + 1)

				continue
			}

			if (!syntax.isStandardFunction(valueNode) || isMathFunction(valueNode.value)) continue

			if (options.ignoreFunctions !== undefined && matchesStringOrRegExp(valueNode.value, options.ignoreFunctions)) continue

			walk(valueNode.nodes)
		}
	}

	walk(valueParser(blanked).nodes)

	return slashes
}
