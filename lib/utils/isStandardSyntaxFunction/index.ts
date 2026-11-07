import type { Node } from "postcss-value-parser"

import { readCallName } from "../readCallName/index.ts"

/**
 * Checks whether a function is standard, not a preprocessor construct.
 * @param node - The value-parser node asked about, a function or a parenthesized group.
 * @param index - Its index among its siblings, needed to weld the name the file spells across the hexadecimal escapes the parser splits on.
 * @param siblings - The nodes of the value the call stands among.
 * @returns True if standard.
 */
export function isStandardSyntaxFunction (node: Node, index?: number, siblings?: Node[]): boolean {
	// A nameless node is a parenthesized group
	if (!node.value) return false

	if (node.value.startsWith(`#{`)) return false

	// CSS-in-JS interpolation
	if (node.value.startsWith(`\${`)) return false

	// CSS-in-JS syntax
	if (node.value.startsWith(`\``)) return false

	// The parser takes the whitespace closing a hexadecimal escape for a divider: `#{$c}\61 \62 rl(` comes back as a call named `rl` with `#{$c}\61` and `\62` separate words before it. `readCallName` welds them back into the name the file spells, so a call opened under an interpolation is recognised whatever the spelling of its name.
	if (index !== undefined && siblings !== undefined) {
		let { name } = readCallName(node, index, siblings)

		if (name.startsWith(`#{`)) return false
		if (name.startsWith(`\${`)) return false
		if (name.startsWith(`\``)) return false
	}

	return true
}
