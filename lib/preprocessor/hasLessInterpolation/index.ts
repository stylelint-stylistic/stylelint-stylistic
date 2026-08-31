import { LESS_INTERPOLATION } from "../regexps.ts"

/**
 * Checks whether a string has Less interpolation.
 * @param string - The string to check.
 * @returns True if the string has Less interpolation, false otherwise.
 */
export function hasLessInterpolation (string: string): boolean {
	return LESS_INTERPOLATION.test(string)
}
