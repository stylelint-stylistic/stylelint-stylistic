import { PSV_INTERPOLATION } from "../../regexps.ts"

/**
 * Checks for postcss-simple-vars interpolation.
 * @param string - Any text, searched for a `$(name)`.
 * @returns True where it has one.
 */
export function hasPsvInterpolation (string: string): boolean {
	return PSV_INTERPOLATION.test(string)
}
