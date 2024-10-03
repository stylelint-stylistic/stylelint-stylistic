/**
 * Check whether the declaration is processed by `postcss-styled-syntax`.
 *
 * @param {import('postcss').Declaration} declaration
 * @returns {boolean}
 */
export function isStyledSyntaxDeclaration (declaration) {
	let parent = declaration.parent

	while (parent) {
		if (parent.raws.styledSyntaxRangeStart !== undefined) {
			return true
		}
		parent = parent.parent
	}

	return false
}
