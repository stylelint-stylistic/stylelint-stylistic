/**
 * Check whether a media query is a custom
 * @param {string} mediaQuery
 * @returns {boolean}
 */
export function isCustomMediaQuery (mediaQuery) {
	return mediaQuery.startsWith(`--`)
}
