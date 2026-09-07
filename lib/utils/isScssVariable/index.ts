/**
 * Whether a property name is a Sass variable, `$var` or `namespace.$var`.
 * @param property - The property name.
 * @returns True where it is.
 */
export function isScssVariable (property: string): boolean {
	// `$var`, `$list: (x)` or `$map: (k: v)`
	if (property.startsWith(`$`)) return true

	// `namespace.$var`
	if (property.includes(`.$`)) return true

	return false
}
