import { matchesStringOrRegExp } from "../matchesStringOrRegExp/index.js"
import { isObject } from "../validateTypes/index.js"

/**
 * Checks if an options object's propertyName contains a user-defined string or regex that matches the passed in input.
 * @param {unknown} options - The options object, or whatever stands where one is expected.
 * @param {string} propertyName - The property name to check.
 * @param {unknown} input - The input to match.
 * @returns {boolean} True if a match is found, false otherwise.
 */
export function optionsMatches (options, propertyName, input) {
	if (!isObject(options)) return false

	// What a user wrote under that name, which `validateOptions` has already held to the shapes the rule declares
	let comparison = /** @type {Record<string, string | RegExp | (string | RegExp)[] | undefined>} */ (options)[propertyName]

	return Boolean(comparison && typeof input === `string` && matchesStringOrRegExp(input, comparison))
}
