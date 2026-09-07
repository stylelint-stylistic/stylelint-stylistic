import type { Container } from "postcss"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.ts"

/**
 * Sets the block's final raw where the parser filed it, the raw {@link lastNodeHoldsTheBlockAfter} names and `getBlockAfter` reads: the last node's `raws.between`, behind whatever else it holds, where that node swallowed the run. It stays there, since `declaration-block-trailing-semicolon` reads `raws.between` for it.
 * @param statement - The statement carrying the block.
 * @param after - The run to write.
 * @returns The statement.
 */
export function setBlockAfter (statement: Container, after: string): Container {
	if (!lastNodeHoldsTheBlockAfter(statement)) {
		statement.raws.after = after

		return statement
	}

	let last = statement.last

	last.raws.between = (last.raws.between ?? ``).replace(TRAILING_WHITESPACE, ``) + after

	return statement
}
