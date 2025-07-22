import { hasInterpolation } from "../hasInterpolation/index.js"
import { isScssVariable } from "../isScssVariable/index.js"

/**
 * Check whether a property is standard
 *
 * @param {string} property
 * @returns {boolean}
 */
export function isStandardSyntaxProperty (property) {
	// SCSS var
	if (isScssVariable(property)) {
		return false
	}

	// Less var (e.g. @var: x)
	if (property.startsWith(`@`)) {
		return false
	}

	// Less append property value with space (e.g. transform+_: scale(2))
	if (property.endsWith(`+`) || property.endsWith(`+_`)) {
		return false
	}

	// SCSS or Less interpolation
	if (hasInterpolation(property)) {
		return false
	}

	return true
}
