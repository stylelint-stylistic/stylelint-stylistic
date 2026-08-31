import { hasLessInterpolation } from "../hasLessInterpolation/index.ts"
import { hasPsvInterpolation } from "../hasPsvInterpolation/index.ts"
import { hasScssInterpolation } from "../hasScssInterpolation/index.ts"
import { hasTplInterpolation } from "../hasTplInterpolation/index.ts"

/**
 * Checks whether a string has interpolation.
 * @param string - The string to check.
 * @returns True if the string has interpolation, false otherwise.
 */
export function hasInterpolation (string: string): boolean {
	// SCSS or Less interpolation
	if (hasLessInterpolation(string) || hasScssInterpolation(string) || hasTplInterpolation(string) || hasPsvInterpolation(string)) return true

	return false
}
