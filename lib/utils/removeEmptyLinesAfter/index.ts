import { EVERY_EMPTY_LINE_RUN, EVERY_SEMICOLON } from "../../regexps.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { setBlockAfter } from "../setBlockAfter/index.ts"

/**
 * Removes empty lines after a node. Mutates the node.
 *
 * The line is taken out of the block's final raw, which {@link getBlockAfter} and `setBlockAfter` find wherever the parser filed it — inside the node closing the block, where that node has swallowed it.
 *
 * The first break of a run is what the run is written back as, so the line that is left is spelled the way the file spells its lines. `context.newline` cannot say: it reads a Windows pair or a line feed and knows no other break.
 *
 * A stray semicolon standing between two breaks is kept and the empty line around it taken away. The readers of this question measure the whitespace with the semicolons taken out, so an empty line spelled `\n;\n` is one to them; leaving the run alone there would report a problem that no run of `--fix` could clear.
 * @param node - The PostCSS node to modify.
 * @returns The modified node.
 */
export function removeEmptyLinesAfter<T extends import("postcss").Rule | import("postcss").AtRule> (node: T): T {
	let blockAfter = getBlockAfter(node)

	setBlockAfter(node, blockAfter ? blockAfter.replaceAll(EVERY_EMPTY_LINE_RUN, (run, first) => first + (run.match(EVERY_SEMICOLON) || []).join(``)) : ``)

	return node
}
