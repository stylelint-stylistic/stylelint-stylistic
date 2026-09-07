import { VENDOR_PREFIX } from "../regexps.ts"

/**
 * The math functions of CSS, whose arguments are a calculation.
 *
 * A solidus inside one is division, not a separator; `postcss-value-parser` returns it as a word inside a lowercase unprefixed `calc` and as a `div` node elsewhere. Stylelint's `mathFunctions` cannot be imported; {@link isMathFunction} handles case and vendor prefix.
 */
export const MATH_FUNCTIONS: Set<string> = new Set([`abs`, `acos`, `asin`, `atan`, `atan2`, `calc`, `clamp`, `cos`, `exp`, `hypot`, `log`, `max`, `min`, `mod`, `pow`, `rem`, `round`, `sign`, `sin`, `sqrt`, `tan`])

/**
 * Asks whether a name is a math function's, in any case and behind any vendor prefix.
 * @param name - The call's name.
 * @returns True where its arguments are a calculation.
 */
export function isMathFunction (name: string): boolean {
	return MATH_FUNCTIONS.has(name.toLowerCase().replace(VENDOR_PREFIX, ``))
}
