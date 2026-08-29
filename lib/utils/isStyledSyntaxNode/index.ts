/**
 * Checks whether the Node is processed by `postcss-styled-syntax`.
 * @param node - The node to check.
 * @returns True if the node is processed by postcss-styled-syntax, false otherwise.
 */
export function isStyledSyntaxNode (node: import("postcss").Node): boolean {
	return node.parent?.raws.styledSyntaxRangeStart !== undefined
}
