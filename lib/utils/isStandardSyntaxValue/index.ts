import { EXTENSION_MESSAGE, LEADING_OPERATOR } from "../../regexps.ts"
import { hasInterpolation } from "../hasInterpolation/index.ts"

/**
 * Checks whether a value is standard (i.e. not a preprocessor construct).
 * @param value - The value to check.
 * @returns True if the value is standard syntax, false otherwise.
 */
export function isStandardSyntaxValue (value: string): boolean {
	let normalizedValue = value

	// Ignore operators before variables (example -$variable)
	if (LEADING_OPERATOR.test(value.charAt(0))) normalizedValue = normalizedValue.slice(1)

	// A `$` variable (example $variable) — Sass's, and postcss-simple-vars' over plain CSS
	if (normalizedValue.startsWith(`$`)) return false

	// SCSS or Less interpolation
	if (hasInterpolation(normalizedValue)) return false

	// WebExtension replacement keyword used by Chrome/Firefox. More information: https://developer.chrome.com/extensions/i18n and https://github.com/stylelint/stylelint/issues/4707
	if (EXTENSION_MESSAGE.test(value)) return false

	return true
}
