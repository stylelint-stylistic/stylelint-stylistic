import type { Container } from "postcss"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.ts"

/**
 * Gets the block's final raw — the run standing between the last thing the block holds and its closing brace — wherever the parser filed it.
 *
 * Only where {@link lastNodeHoldsTheBlockAfter} says the node closing the block has swallowed that run is it read out of that node: it is the whitespace its `raws.between` ends in, and everything in front of that whitespace is the node's own text. A missing `raws.between` is read as an empty one, since that is what PostCSS prints in its place; a missing `raws.after` is handed back as it stands, PostCSS computing a raw of its own where a block carries none.
 * @param statement - The statement carrying the block.
 * @returns The run, undefined where the block carries no raw for it.
 */
export function getBlockAfter (statement: Container): string | undefined {
	if (!lastNodeHoldsTheBlockAfter(statement)) return statement.raws.after

	let between = statement.last.raws.between ?? ``

	return between.slice(between.replace(TRAILING_WHITESPACE, ``).length)
}
