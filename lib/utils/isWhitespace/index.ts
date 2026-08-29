/**
 * Checks if a character is whitespace.
 * @param char - The character to check.
 * @returns True if the character is whitespace, false otherwise.
 */
export function isWhitespace (char: string): boolean {
	return [` `, `\n`, `\t`, `\r`, `\f`].includes(char)
}
