import { hasInterpolation } from "../hasInterpolation/index.ts"
import { isScssVariable } from "../isScssVariable/index.ts"

/**
 * Checks whether a property is no preprocessor construct.
 * @param property - The declaration's property name as written.
 * @returns True where it is.
 */
export function isStandardSyntaxProperty (property: string): boolean {
	// A `$` variable, Sass's or postcss-simple-vars'
	if (isScssVariable(property)) return false

	// SCSS or Less interpolation
	if (hasInterpolation(property)) return false

	return true
}
