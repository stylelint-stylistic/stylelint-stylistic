/**
 * Check whether the Node is processed by `postcss-styled-syntax`.
 *
 * @param {import('postcss').Node} node
 * @returns {boolean}
 */
export function isStyledSyntaxNode (node) {
	return node.parent?.raws.styledSyntaxRangeStart !== undefined
}
