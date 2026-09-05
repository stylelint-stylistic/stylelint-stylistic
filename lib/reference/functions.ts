import { VENDOR_PREFIX } from "../regexps.ts"

/**
 * The math functions of CSS, whose arguments are a calculation.
 *
 * A solidus inside one is the division operator and no separator of the value, so a rule about a separator reads nothing inside them. `postcss-value-parser` is no help in telling the two apart: inside a lowercase unprefixed `calc` the solidus arrives as a word, and inside `CALC()`, `-webkit-calc()`, `min()` and `clamp()` as the same `div` node a separator arrives as. Stylelint keeps the same names in `mathFunctions`, which is an internal module of it and cannot be imported, so they are spelled out here; a vendor-prefixed or capitalised spelling is read through {@link isMathFunction}.
 */
export const MATH_FUNCTIONS: Set<string> = new Set([`abs`, `acos`, `asin`, `atan`, `atan2`, `calc`, `clamp`, `cos`, `exp`, `hypot`, `log`, `max`, `min`, `mod`, `pow`, `rem`, `round`, `sign`, `sin`, `sqrt`, `tan`])

/**
 * Asks whether a name is that of a math function, in whatever case and behind whatever vendor prefix the file spells it.
 * @param name - The name of a call, as `postcss-value-parser` hands it over.
 * @returns True where the call's arguments are a calculation.
 */
export function isMathFunction (name: string): boolean {
	return MATH_FUNCTIONS.has(name.toLowerCase().replace(VENDOR_PREFIX, ``))
}
