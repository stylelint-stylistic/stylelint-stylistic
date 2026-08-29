import type { Container, Declaration, Document } from "postcss"

/**
 * Checks whether the declaration is processed by `postcss-styled-syntax`.
 * @param declaration - The CSS declaration node.
 * @returns True if the declaration is processed by postcss-styled-syntax, false otherwise.
 */
export function isStyledSyntaxDeclaration (declaration: Declaration): boolean {
	let parent: Container | Document | undefined = declaration.parent

	while (parent) {
		if (parent.raws.styledSyntaxRangeStart !== undefined) return true

		parent = parent.parent
	}

	return false
}
