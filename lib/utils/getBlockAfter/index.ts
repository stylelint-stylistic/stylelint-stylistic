import type { Container } from "postcss"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.ts"

/**
 * Returns the run between a block's last node and its closing brace, wherever the parser filed it.
 *
 * Where {@link lastNodeHoldsTheBlockAfter} says the last node swallowed the run, it is the trailing whitespace of that node's `raws.between`; otherwise `raws.after` as it stands, since PostCSS computes a default for a missing one.
 * @param statement - The block's statement.
 * @returns The run, or undefined without a raw.
 */
export function getBlockAfter (statement: Container): string | undefined {
	if (!lastNodeHoldsTheBlockAfter(statement)) return statement.raws.after

	let between = statement.last.raws.between ?? ``

	return between.slice(between.replace(TRAILING_WHITESPACE, ``).length)
}
