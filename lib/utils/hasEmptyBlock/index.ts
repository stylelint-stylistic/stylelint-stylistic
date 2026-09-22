import type { Container } from "postcss"

import { hasBlock } from "../hasBlock/index.ts"

/**
 * Asks whether a statement has a block with nothing in it.
 * @param statement - The node carrying the block.
 * @returns True where the block is there and empty.
 */
export function hasEmptyBlock (statement: Container): boolean {
	return hasBlock(statement) && statement.nodes.length === 0
}
