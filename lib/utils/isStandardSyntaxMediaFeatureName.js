/**
 * Check whether a media feature name is standard
 *
 * @param {string} mediaFeatureName
 * @returns {boolean}
 */
export default function isStandardSyntaxMediaFeatureName (mediaFeatureName) {
	// SCSS interpolation
	if (/#\{.+?\}|\$.+/.test(mediaFeatureName)) {
		return false
	}

	return true
}
