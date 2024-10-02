/**
 * Check whether the declaration is processed by `postcss-styled-syntax`.
 *
 * @param {import('postcss').Declaration} declaration
 * @returns {boolean}
 */
export function isStyledSyntaxDeclaration (declaration) {
	return declaration.parent?.parent?.raws.styledSyntaxRangeStart !== undefined
}
