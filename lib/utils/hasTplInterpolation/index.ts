import { TPL_INTERPOLATION } from "../../regexps.ts"

/**
 * Checks whether a string holds a JS template literal interpolation or an HTML-like template tag.
 * @param string - The text searched for an interpolation or a tag.
 * @returns True where it does.
 */
export function hasTplInterpolation (string: string): boolean {
	return TPL_INTERPOLATION.test(string)
}
