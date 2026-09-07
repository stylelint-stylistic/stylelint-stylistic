import type { Node } from "postcss-value-parser"

/**
 * Checks whether a function is standard, not a preprocessor construct.
 * @param node - The value-parser node asked about, a function or a parenthesised group.
 * @returns True if standard.
 */
export function isStandardSyntaxFunction (node: Node): boolean {
	// A nameless node is a parenthesised group
	if (!node.value) return false

	if (node.value.startsWith(`#{`)) return false

	// CSS-in-JS interpolation
	if (node.value.startsWith(`\${`)) return false

	// CSS-in-JS syntax
	if (node.value.startsWith(`\``)) return false

	return true
}
