import { PSV_INTERPOLATION } from "../../regexps.js"

/**
 * Checks whether a string has postcss-simple-vars interpolation.
 * @param {string} string - The string to check.
 * @returns {boolean} True if the string has postcss-simple-vars interpolation, false otherwise.
 */
export function hasPsvInterpolation (string) {
	return PSV_INTERPOLATION.test(string)
}
