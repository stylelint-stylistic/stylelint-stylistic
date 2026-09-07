import type { Combinator } from "postcss-selector-parser"

/**
 * Asks whether a combinator is standard, not a reference combinator.
 * @param node - The combinator.
 * @returns True for a standard combinator.
 */
export function isStandardSyntaxCombinator (node: Combinator): boolean {
	// Not a combinator
	if (node.type !== `combinator`) return false

	// A reference combinator like `/deep/`
	if (node.value.startsWith(`/`) || node.value.endsWith(`/`)) return false

	// First or last in its container
	if (node.parent !== undefined && node.parent !== null) {
		let parent = node.parent

		if (node === parent.first) return false

		if (node === parent.last) return false
	}

	return true
}
