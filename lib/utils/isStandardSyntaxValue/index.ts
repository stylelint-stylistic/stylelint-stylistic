import { EXTENSION_MESSAGE, LEADING_OPERATOR } from "../../regexps.ts"
import { hasTplInterpolation } from "../hasTplInterpolation/index.ts"

/**
 * Checks whether a value is standard (i.e. not a preprocessor construct).
 * @param value - The value to check.
 * @returns True if the value is standard syntax, false otherwise.
 */
export function isStandardSyntaxValue (value: string): boolean {
	let normalizedValue = value

	// Ignore operators before variables (example -$variable)
	if (LEADING_OPERATOR.test(value.charAt(0))) normalizedValue = normalizedValue.slice(1)

	// Template interpolation, a pair of braces included, whatever spells them
	if (hasTplInterpolation(normalizedValue)) return false

	// WebExtension replacement keyword used by Chrome/Firefox. More information: https://developer.chrome.com/extensions/i18n and https://github.com/stylelint/stylelint/issues/4707
	if (EXTENSION_MESSAGE.test(value)) return false

	return true
}
