import type { AtRule, Rule } from "postcss"
import type { PostcssResult } from "stylelint"

import { CAPTURED_LINE_BREAK, LINE_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { setBlockAfter } from "../setBlockAfter/index.ts"

/**
 * Adds an empty line after a node. Mutates the node.
 *
 * The line is written into the block's final raw, which {@link getBlockAfter} and `setBlockAfter` find wherever the parser filed it — inside the node closing the block, where that node has swallowed it.
 * @param syntax - The syntax the rule is built over, whose namespace names the `linebreaks` rule the break is read from.
 * @param node - The PostCSS node to modify.
 * @param result - The Stylelint result, which holds the configuration the break to write is read from.
 * @returns The modified node.
 */
export function addEmptyLineAfter<T extends Rule | AtRule> (syntax: Syntax, node: T, result: PostcssResult): T {
	let blockAfter = getBlockAfter(node)

	if (typeof blockAfter !== `string`) return node

	// A stray semicolon standing here is not the node's, and the empty line belongs behind it rather than in front: the text after the last one is where the break is looked for and where it is written
	let start = blockAfter.lastIndexOf(`;`) + 1
	let after = blockAfter.slice(start)

	// A break already standing here is written twice over rather than added to, so that the empty line opens where that break opens and the indentation of the closing brace stays behind it
	if (LINE_BREAK.test(after)) {
		setBlockAfter(node, blockAfter.slice(0, start) + after.replace(CAPTURED_LINE_BREAK, `$1$1`))

		return node
	}

	// Nothing stands there to write twice, so the empty line is spelled the way a written break is: as `linebreaks` asks, or as the file spells its lines
	setBlockAfter(node, blockAfter + getLineBreak(syntax, node, result).repeat(2))

	return node
}
