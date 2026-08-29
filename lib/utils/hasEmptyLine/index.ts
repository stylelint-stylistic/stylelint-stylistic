import { EMPTY_LINE } from "../../regexps.ts"

/**
 * Checks if a string contains at least one empty line.
 * @param string - The string to check.
 * @returns True if the string contains an empty line, false otherwise.
 */
export function hasEmptyLine (string: string | undefined): boolean {
	if (string === `` || string === undefined) return false

	return EMPTY_LINE.test(string)
}
