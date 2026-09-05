import type { AtRule, Declaration } from "postcss"
import valueParser, { type Node as ValueParserNode } from "postcss-value-parser"
import type { PostcssResult } from "stylelint"

import { isMathFunction } from "../../reference/functions.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blankComments } from "../blankComments/index.ts"
import { matchesStringOrRegExp } from "../matchesStringOrRegExp/index.ts"
import { opensAnAddress } from "../opensAnAddress/index.ts"

/** What the walk is told about the text it reads. */
export type SlashOptions = {

	/** True where a parenthesised group with no name in front of it is read into. The features of a media query and the grouped conditions around them are such groups, while in a declaration's value a group is the arithmetic of a preprocessor, a list of Sass or the free text of a custom property, and no solidus of it is a separator CSS spells. */
	readsGroups: boolean,

	/** The calls whose arguments are passed over, everything nested inside them included. */
	ignoreFunctions?: string | RegExp | (string | RegExp)[] | undefined,
}

/**
 * Finds where the token a bare address opens on closes, the way PostCSS's tokenizer and the scan that finds the comments read it: every parenthesis counts, quotation marks or not, and an escaped one is none.
 *
 * `postcss-value-parser` closes a bare address on the first closing parenthesis instead, and hands whatever the token holds behind it back as nodes of the value: `url(var(--a) // c` on one line and `/2)` on the next is one token to PostCSS, to `postcss-scss` and to `postcss-less`, no comment in it and no address either, and the value parser makes a call closed on `var(--a`, two dividers, a word and a divider of the rest. A solidus the parser hands back out of such a token is a character of the address and is passed over with it (#548).
 * @param text - The text, with its comments blanked.
 * @param openIndex - The index behind the opening parenthesis.
 * @returns The index behind the closing parenthesis, or the end of the text where the token is left open.
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
 * Finds every solidus of a text that separates two parts of a value, as CSS spells one between the numbers of a ratio, the sizes of a font shorthand, the lines of a grid area and the colour and the alpha of a colour function.
 *
 * The text is parsed in a copy with every comment blanked out (#378, #504), so that the text of a comment reaches the parser as spaces and every node stands at the position the file spells it at. Of what the parse holds, four things are no separator and are passed over with everything inside them: the address of a `url()`, whatever spelling the name is written in, since a solidus there is a character of the address; the arguments of a math function, where the solidus is the division operator; a call the syntax does not read as one, an interpolation for one; and a call the options name. A parenthesised group is read into or passed over as the caller says. What the syntax itself computes with a solidus — the division of Sass beside a variable or a call of its own — is asked of the syntax at each one, since only the syntax that spelled the file can say which of its solidi are operators.
 *
 * The index handed back is that of the solidus itself, counted in the text as the file spells it: a `div` node opens where the whitespace in front of the solidus does, and that run is the parser's whole run, a vertical tab included, so adding its length lands on the character. What stands beside the solidus is for the caller to measure in the text, the tokenizer's way (#494), and no node of the parse is read for its whitespace here.
 * @param text - The text, as `Syntax#read` hands it over.
 * @param syntax - The syntax the rule is built over.
 * @param node - The declaration or at-rule the text belongs to.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @param options - What is read into and what is passed over.
 * @returns The index of each such solidus in the text, in the order they stand.
 */
export function findSeparatorSlashes (text: string, syntax: Syntax, node: AtRule | Declaration, result: PostcssResult, options: SlashOptions): number[] {
	let slashes: number[] = []
	let blanked = blankComments(text, syntax.printedComments(node, text, result))

	/**
	 * Walks one list of nodes, into every call that is read.
	 * @param nodes - The nodes, of the value or of a call's arguments.
	 */
	function walk (nodes: ValueParserNode[]): void {
		// Where the token of a bare address ends, past the call the parser closed it as, so that the siblings the parser made of the token's tail are passed over with it
		let addressEnd = 0

		for (let [at, valueNode] of nodes.entries()) {
			if (valueNode.sourceIndex < addressEnd) continue

			if (valueNode.type === `div`) {
				let index = valueNode.sourceIndex + valueNode.before.length

				// Two solidi in a row separate nothing: no grammar of CSS spells a pair, a syntax that reads a comment in one has had it blanked already, and what is left is text every tokenizer keeps whole — `1px!important//!important` holds a pair the parser hands back as two dividers, and a space written between them takes the pair apart (#548)
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

				// A quoted address is a string the parser closed on its own mark, and the parenthesis behind it is the token's; a bare one is closed where the tokenizer closes it
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
