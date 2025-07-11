import { isWhitespace } from "../isWhitespace/index.js"

/**
 * Returns a Boolean indicating whether the input string is only whitespace.
 *
 * @param {string} input
 * @returns {boolean}
 */
export function isOnlyWhitespace (input) {
	for (let element of input) {
		if (!isWhitespace(element)) {
			return false
		}
	}

	return true
}
