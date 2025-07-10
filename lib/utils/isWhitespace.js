/**
 * Check if a character is whitespace.
 *
 * @param {string} char
 * @returns {boolean}
 */
export function isWhitespace (char) {
	return [` `, `\n`, `\t`, `\r`, `\f`].includes(char)
}
