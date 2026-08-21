import { SCSS_INTERPOLATION } from "../../regexps.js"

/**
 * Checks whether a string has SCSS interpolation.
 * @param {string} string - The string to check.
 * @returns {boolean} True if the string has SCSS interpolation, false otherwise.
 */
export function hasScssInterpolation (string) {
	return SCSS_INTERPOLATION.test(string)
}
