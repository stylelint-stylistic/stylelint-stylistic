/**
 * Checks if the value is a boolean or a Boolean object.
 * @param {unknown} value
 * @returns {value is boolean}
 */
export function isBoolean (value) {
	return typeof value === `boolean` || value instanceof Boolean
}

/**
 * Checks if the value is a function or a Function object.
 * @param {unknown} value
 * @returns {value is Function}
 */
export function isFunction (value) {
	return typeof value === `function` || value instanceof Function
}

/**
 * Checks if the value is *nullish*.
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Nullish
 * @param {unknown} value
 * @returns {value is null | undefined}
 */
export function isNullish (value) {
	return value === null || value === undefined
}

/**
 * Checks if the value is a number or a Number object.
 * @param {unknown} value
 * @returns {value is number}
 */
export function isNumber (value) {
	return typeof value === `number` || value instanceof Number
}

/**
 * Checks if the value is an object.
 * @param {unknown} value
 * @returns {value is object}
 */
export function isObject (value) {
	return value !== null && typeof value === `object`
}

/**
 * Checks if the value is a regular expression.
 * @param {unknown} value
 * @returns {value is RegExp}
 */
export function isRegExp (value) {
	return value instanceof RegExp
}

/**
 * Checks if the value is a string or a String object.
 * @param {unknown} value
 * @returns {value is string}
 */
export function isString (value) {
	return typeof value === `string` || value instanceof String
}

/**
 * Assert that the value is truthy.
 * @param {unknown} value
 * @param {string} [message]
 * @returns {asserts value}
 */
export function assert (value, message = undefined) {
	if (message) {
		console.assert(value, message)
	} else {
		console.assert(value)
	}
}

/**
 * Assert that the value is a function or a Function object.
 * @param {unknown} value
 * @returns {asserts value is Function}
 */
export function assertFunction (value) {
	console.assert(isFunction(value), `"${value}" must be a function`)
}

/**
 * Assert that the value is a string or a String object.
 * @param {unknown} value
 * @returns {asserts value is string}
 */
export function assertString (value) {
	console.assert(isString(value), `"${value}" must be a string`)
}
