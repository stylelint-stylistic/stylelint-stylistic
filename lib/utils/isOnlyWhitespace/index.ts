import { isWhitespace } from "../isWhitespace/index.ts"

/**
 * Returns a boolean indicating whether the input string is only whitespace.
 * @param input - The string to check.
 * @returns True if the string contains only whitespace, false otherwise.
 */
export function isOnlyWhitespace (input: string): boolean {
	for (let element of input) if (!isWhitespace(element)) return false

	return true
}
