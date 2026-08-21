import { EXTENSION_MESSAGE, LEADING_OPERATOR, SCSS_MODULE_FUNCTION, SCSS_MODULE_VARIABLE } from "../../regexps.js"
import { hasInterpolation } from "../hasInterpolation/index.js"

/**
 * Checks whether a value is standard (i.e. not a preprocessor construct).
 * @param {string} value - The value to check.
 * @returns {boolean} True if the value is standard syntax, false otherwise.
 */
export function isStandardSyntaxValue (value) {
	let normalizedValue = value

	// Ignore operators before variables (example -$variable)
	if (LEADING_OPERATOR.test(value.charAt(0))) normalizedValue = normalizedValue.slice(1)

	// SCSS variable (example $variable)
	if (normalizedValue.startsWith(`$`)) return false

	// SCSS namespace (example namespace.$variable)
	if (SCSS_MODULE_VARIABLE.test(value)) return false

	// SCSS namespace (example namespace.function-name())
	if (SCSS_MODULE_FUNCTION.test(value)) return false

	// Less variable
	if (normalizedValue.startsWith(`@`)) return false

	// SCSS or Less interpolation
	if (hasInterpolation(normalizedValue)) return false

	// WebExtension replacement keyword used by Chrome/Firefox. More information: https://developer.chrome.com/extensions/i18n and https://github.com/stylelint/stylelint/issues/4707
	if (EXTENSION_MESSAGE.test(value)) return false

	return true
}
