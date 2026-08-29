/**
 * Checks whether a property is a custom one.
 * @param property - The CSS property name.
 * @returns True if the property is custom, false otherwise.
 */
export function isCustomProperty (property: string): boolean {
	return property.startsWith(`--`)
}
