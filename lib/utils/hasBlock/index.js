/**
 * Checks if a statement has a block (empty or otherwise).
 * @template {import('postcss').Node} T
 * @param {T} statement - The PostCSS container node.
 * @returns {statement is T & { nodes: import('postcss').ChildNode[] }} True if the `statement` has a block (empty or otherwise).
 */
export function hasBlock (statement) {
	return `nodes` in statement && statement.nodes !== undefined
}
