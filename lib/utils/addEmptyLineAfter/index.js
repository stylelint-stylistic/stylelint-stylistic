import { CAPTURED_LINE_BREAK, LINE_BREAK } from "../../regexps.js"
import { getBlockAfter } from "../getBlockAfter/index.js"
import { getLineEnding } from "../getLineEnding/index.js"
import { setBlockAfter } from "../setBlockAfter/index.js"

/**
 * Adds an empty line after a node. Mutates the node.
 *
 * The line is written into the block's final raw, which {@link getBlockAfter} and `setBlockAfter` find wherever the parser filed it — inside the node closing the block, where that node has swallowed it.
 * @template {import('postcss').Rule | import('postcss').AtRule} T
 * @param {T} node - The PostCSS node to modify.
 * @param {string} newline - The newline to write wherever {@link getLineEnding} cannot answer, the file that ends no line at all being the one such case a stylesheet reaches.
 * @returns {T} The modified node.
 */
export function addEmptyLineAfter (node, newline) {
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

	// Nothing stands there to write twice, so the empty line is spelled the way the file spells its lines. `context.newline` is left for the file that ends no line at all, since it reads a line feed and a Windows pair and knows neither of the two other breaks a file is written with
	setBlockAfter(node, blockAfter + (getLineEnding(node) ?? newline).repeat(2))

	return node
}
