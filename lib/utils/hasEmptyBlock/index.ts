import { hasBlock } from "../hasBlock/index.ts"

/**
 * Checks if a statement has an empty block.
 * @param statement - The PostCSS rule or at-rule node.
 * @returns True if the statement has a block and it is empty.
 */
export function hasEmptyBlock (statement: import("postcss").Rule | import("postcss").AtRule): boolean {
	return hasBlock(statement) && statement.nodes.length === 0
}
