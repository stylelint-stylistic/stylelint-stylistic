import { SCSS_INTERPOLATION } from "../../regexps.ts"

/**
 * Whether a string holds an SCSS interpolation.
 * @param string - The text.
 * @returns True when it does.
 */
export function hasScssInterpolation (string: string): boolean {
	return SCSS_INTERPOLATION.test(string)
}
