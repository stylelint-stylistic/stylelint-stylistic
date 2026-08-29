/**
 * Checks whether the declaration is processed by `postcss-styled-syntax`.
 * @param {import('postcss').Declaration} declaration - The CSS declaration node.
 * @returns {boolean} True if the declaration is processed by postcss-styled-syntax, false otherwise.
 */
export function isStyledSyntaxDeclaration (declaration) {
	/** @type {import('postcss').Container | import('postcss').Document | undefined} */
	let parent = declaration.parent

	while (parent) {
		if (parent.raws.styledSyntaxRangeStart !== undefined) return true

		parent = parent.parent
	}

	return false
}
