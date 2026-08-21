import { EMPTY_LINE } from "../../regexps.js"

/**
 * Checks if a string contains at least one empty line.
 * @param {string | undefined} string - The string to check.
 * @returns {boolean} True if the string contains an empty line, false otherwise.
 */
export function hasEmptyLine (string) {
	if (string === `` || string === undefined) return false

	return EMPTY_LINE.test(string)
}
