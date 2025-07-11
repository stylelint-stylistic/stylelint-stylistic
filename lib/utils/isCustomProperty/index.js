/**
 * Check whether a property is a custom one
 * @param {string} property
 * @returns {boolean}
 */
export function isCustomProperty (property) {
	return property.startsWith(`--`)
}
