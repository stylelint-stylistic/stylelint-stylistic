import { CR_OR_LF } from "../../regexps.js"

/**
 * Checks if a string is a single line (i.e. does not contain any newline characters).
 * @param {string} input - The string to check.
 * @returns {boolean} True if the string is a single line, false otherwise.
 */
export function isSingleLineString (input) {
	return !CR_OR_LF.test(input)
}
