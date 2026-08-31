import { hasTplInterpolation } from "../hasTplInterpolation/index.ts"

/**
 * Checks whether a property is standard (i.e. not a template construct).
 * @param property - The property to check.
 * @returns True if the property is standard syntax, false otherwise.
 */
export function isStandardSyntaxProperty (property: string): boolean {
	// Template interpolation, a pair of braces included, whatever spells them
	if (hasTplInterpolation(property)) return false

	return true
}
