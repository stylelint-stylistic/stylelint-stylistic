/**
 * Checks whether a property is custom.
 * @param property - The property name.
 * @returns True if custom.
 */
export function isCustomProperty (property: string): boolean {
	return property.startsWith(`--`)
}
