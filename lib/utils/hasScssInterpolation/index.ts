import { SCSS_INTERPOLATION } from "../../regexps.ts"

/**
 * Checks whether a string has SCSS interpolation.
 * @param string - The string to check.
 * @returns True if the string has SCSS interpolation, false otherwise.
 */
export function hasScssInterpolation (string: string): boolean {
	return SCSS_INTERPOLATION.test(string)
}
