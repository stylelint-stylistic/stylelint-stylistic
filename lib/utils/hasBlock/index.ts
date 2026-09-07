import type { ChildNode, Node } from "postcss"

/**
 * Asks whether a statement has a block, empty or not.
 * @param statement - The node.
 * @returns True where it has a block.
 */
export function hasBlock<T extends Node> (statement: T): statement is T & { nodes: ChildNode[] } {
	return `nodes` in statement && statement.nodes !== undefined
}
