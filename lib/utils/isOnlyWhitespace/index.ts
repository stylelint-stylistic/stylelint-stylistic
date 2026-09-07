import { isWhitespace } from "../isWhitespace/index.ts"

/**
 * Tells whether a string is whitespace alone.
 * @param input - The string.
 * @returns True if every character is whitespace.
 */
export function isOnlyWhitespace (input: string): boolean {
	for (let element of input) if (!isWhitespace(element)) return false

	return true
}
