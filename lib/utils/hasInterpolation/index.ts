import { hasLessInterpolation } from "../hasLessInterpolation/index.ts"
import { hasPsvInterpolation } from "../hasPsvInterpolation/index.ts"
import { hasScssInterpolation } from "../hasScssInterpolation/index.ts"
import { hasTplInterpolation } from "../hasTplInterpolation/index.ts"

/**
 * Whether a string holds an interpolation of any syntax.
 * @param string - The text searched for an interpolation.
 * @returns True where it does.
 */
export function hasInterpolation (string: string): boolean {
	// Less, Sass, template or simple-vars
	if (hasLessInterpolation(string) || hasScssInterpolation(string) || hasTplInterpolation(string) || hasPsvInterpolation(string)) return true

	return false
}
