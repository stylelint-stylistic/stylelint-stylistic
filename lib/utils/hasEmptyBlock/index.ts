import type { AtRule, Rule } from "postcss"

import { hasBlock } from "../hasBlock/index.ts"

/**
 * Asks whether a statement has a block with nothing in it.
 * @param statement - The rule or at-rule.
 * @returns True where the block is there and empty.
 */
export function hasEmptyBlock (statement: Rule | AtRule): boolean {
	return hasBlock(statement) && statement.nodes.length === 0
}
