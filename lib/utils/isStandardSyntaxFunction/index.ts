import type { Node } from "postcss-value-parser"

/**
 * Checks whether a function is standard (i.e. not a preprocessor construct).
 * @param node - The function node to check.
 * @returns True if the function is standard syntax, false otherwise.
 */
export function isStandardSyntaxFunction (node: Node): boolean {
	// A function node without a name is a parenthesised group and no call: the inner parentheses of `calc((1px + 2px) * 2)`, the group a custom property is allowed to carry — and a Sass list, which the namespaces read the same way
	if (!node.value) return false

	if (node.value.startsWith(`#{`)) return false

	// CSS-in-JS interpolation
	if (node.value.startsWith(`\${`)) return false

	// CSS-in-JS syntax
	if (node.value.startsWith(`\``)) return false

	return true
}
