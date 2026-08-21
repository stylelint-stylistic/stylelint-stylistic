import { TPL_INTERPOLATION } from "../../regexps.js"

/**
 * Checks whether a string has JS template literal interpolation or HTML-like template.
 * @param {string} string - The string to check.
 * @returns {boolean} True if the string has template literal interpolation, false otherwise.
 */
export function hasTplInterpolation (string) {
	return TPL_INTERPOLATION.test(string)
}
