import type { ChildNode, Node } from "postcss"

/**
 * Checks if a statement has a block (empty or otherwise).
 * @param statement - The PostCSS container node.
 * @returns True if the `statement` has a block (empty or otherwise).
 */
export function hasBlock<T extends Node> (statement: T): statement is T & { nodes: ChildNode[] } {
	return `nodes` in statement && statement.nodes !== undefined
}
