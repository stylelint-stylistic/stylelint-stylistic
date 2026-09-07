import type { AtRule, Rule } from "postcss"

import { EVERY_EMPTY_LINE_RUN, EVERY_SEMICOLON } from "../../regexps.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { setBlockAfter } from "../setBlockAfter/index.ts"

/**
 * Removes the empty lines after a node, in place. The lines come out of the block's final raw ({@link getBlockAfter}). A run is written back as its first break, keeping the file's spelling. A semicolon between the breaks stays, or the readers, which measure without semicolons, would report `\n;\n` every run.
 * @param node - The rule or at-rule whose final raw holds the lines.
 * @returns The node.
 */
export function removeEmptyLinesAfter<T extends Rule | AtRule> (node: T): T {
	let blockAfter = getBlockAfter(node)

	setBlockAfter(node, blockAfter ? blockAfter.replaceAll(EVERY_EMPTY_LINE_RUN, (run, first) => first + (run.match(EVERY_SEMICOLON) || []).join(``)) : ``)

	return node
}
