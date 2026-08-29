import { TPL_INTERPOLATION } from "../../regexps.ts"

/**
 * Checks whether a string has JS template literal interpolation or HTML-like template.
 * @param string - The string to check.
 * @returns True if the string has template literal interpolation, false otherwise.
 */
export function hasTplInterpolation (string: string): boolean {
	return TPL_INTERPOLATION.test(string)
}
