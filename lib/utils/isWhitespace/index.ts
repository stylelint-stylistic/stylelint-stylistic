/**
 * Checks whether a character is whitespace.
 * @param char - The character.
 * @returns True where it is.
 */
export function isWhitespace (char: string): boolean {
	return [` `, `\n`, `\t`, `\r`, `\f`].includes(char)
}
