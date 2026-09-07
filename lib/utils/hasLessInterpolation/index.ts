import { LESS_INTERPOLATION } from "../../regexps.ts"

/**
 * Asks whether a string has Less interpolation.
 * @param string - The text searched for a Less `@{…}` reading.
 * @returns True where it does.
 */
export function hasLessInterpolation (string: string): boolean {
	return LESS_INTERPOLATION.test(string)
}
