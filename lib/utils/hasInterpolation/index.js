import { hasLessInterpolation } from "../hasLessInterpolation/index.js"
import { hasPsvInterpolation } from "../hasPsvInterpolation/index.js"
import { hasScssInterpolation } from "../hasScssInterpolation/index.js"
import { hasTplInterpolation } from "../hasTplInterpolation/index.js"

/**
 * Check whether a string has interpolation
 *
 * @param {string} string
 * @return {boolean} If `true`, a string has interpolation
 */
export function hasInterpolation (string) {
	// SCSS or Less interpolation
	if (hasLessInterpolation(string) || hasScssInterpolation(string) || hasTplInterpolation(string) || hasPsvInterpolation(string)) {
		return true
	}

	return false
}
