import { PSV_INTERPOLATION } from "../../regexps.ts"

/**
 * Checks whether a string has postcss-simple-vars interpolation.
 * @param string - The string to check.
 * @returns True if the string has postcss-simple-vars interpolation, false otherwise.
 */
export function hasPsvInterpolation (string: string): boolean {
	return PSV_INTERPOLATION.test(string)
}
