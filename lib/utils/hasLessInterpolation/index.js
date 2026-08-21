import { LESS_INTERPOLATION } from "../../regexps.js"

/**
 * Checks whether a string has Less interpolation.
 * @param {string} string - The string to check.
 * @returns {boolean} True if the string has Less interpolation, false otherwise.
 */
export function hasLessInterpolation (string) {
	return LESS_INTERPOLATION.test(string)
}
