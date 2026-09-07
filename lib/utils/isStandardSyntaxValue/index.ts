import { EXTENSION_MESSAGE, LEADING_OPERATOR } from "../../regexps.ts"
import { hasInterpolation } from "../hasInterpolation/index.ts"

/**
 * Asks whether a value is standard, not a preprocessor construct.
 * @param value - The value's text.
 * @returns True if standard.
 */
export function isStandardSyntaxValue (value: string): boolean {
	let normalizedValue = value

	// A leading operator, `-$variable`
	if (LEADING_OPERATOR.test(value.charAt(0))) normalizedValue = normalizedValue.slice(1)

	// A `$` variable: Sass's, or postcss-simple-vars' over plain CSS
	if (normalizedValue.startsWith(`$`)) return false

	// SCSS or Less interpolation
	if (hasInterpolation(normalizedValue)) return false

	// A WebExtension `__MSG_…__` keyword (stylelint/stylelint#4707)
	if (EXTENSION_MESSAGE.test(value)) return false

	return true
}
