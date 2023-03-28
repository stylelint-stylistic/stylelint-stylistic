/**
 * Check whether a media feature is a range context one
 *
 * @param {string} mediaFeature feature
 * @return {boolean} If `true`, media feature is a range context one
 */
export default function isRangeContextMediaFeature(mediaFeature) {
	return mediaFeature.includes(`=`) || mediaFeature.includes(`<`) || mediaFeature.includes(`>`)
}
