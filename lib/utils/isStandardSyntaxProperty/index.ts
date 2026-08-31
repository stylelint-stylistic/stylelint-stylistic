import { hasInterpolation } from "../hasInterpolation/index.ts"
import { isScssVariable } from "../isScssVariable/index.ts"

/**
 * Checks whether a property is standard (i.e. not a preprocessor construct).
 * @param property - The property to check.
 * @returns True if the property is standard syntax, false otherwise.
 */
export function isStandardSyntaxProperty (property: string): boolean {
	// SCSS var
	if (isScssVariable(property)) return false

	// SCSS or Less interpolation
	if (hasInterpolation(property)) return false

	return true
}
