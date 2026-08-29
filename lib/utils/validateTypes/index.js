import { assert as nodeAssert } from "node:console"

/**
 * Checks if the value is a boolean or a Boolean object.
 * @param {unknown} value - The value to check.
 * @returns {value is boolean} True if the value is a boolean, false otherwise.
 */
export function isBoolean (value) {
	// The tag answers for the primitive and for the wrapper alike, which `typeof` alone does not, and reaches across realms, which `instanceof` does not.
	return Object.prototype.toString.call(value) === `[object Boolean]`
}

/**
 * Checks if the value is callable, however it was made — an arrow, a method, a class, one built by `new Function()`, an async one or a generator.
 *
 * A function has no wrapper object of its own the way a boolean or a string does, so `typeof` is the whole answer here.
 * @param {unknown} value - The value to check.
 * @returns {value is Function} True if the value can be called, false otherwise.
 */
export function isFunction (value) {
	return typeof value === `function`
}

/**
 * Checks if the value is *nullish*.
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Nullish
 * @param {unknown} value - The value to check.
 * @returns {value is null | undefined} True if the value is null or undefined, false otherwise.
 */
export function isNullish (value) {
	return value === null || value === undefined
}

/**
 * Checks if the value is a number or a Number object.
 * @param {unknown} value - The value to check.
 * @returns {value is number} True if the value is a number, false otherwise.
 */
export function isNumber (value) {
	return Object.prototype.toString.call(value) === `[object Number]`
}

/**
 * Checks if the value is an object.
 * @param {unknown} value - The value to check.
 * @returns {value is object} True if the value is an object, false otherwise.
 */
export function isObject (value) {
	return value !== null && typeof value === `object`
}

/**
 * Checks if the value is a regular expression.
 * @param {unknown} value - The value to check.
 * @returns {value is RegExp} True if the value is a RegExp, false otherwise.
 */
export function isRegExp (value) {
	return value instanceof RegExp
}

/**
 * Checks if the value is a string or a String object.
 * @param {unknown} value - The value to check.
 * @returns {value is string} True if the value is a string, false otherwise.
 */
export function isString (value) {
	return Object.prototype.toString.call(value) === `[object String]`
}

/**
 * Asserts that the value is truthy.
 * @param {unknown} value - The value to assert.
 * @param {string} [message] - The error message to display if the assertion fails.
 * @returns {asserts value} Nothing; past the call the value is known to be truthy.
 * @throws {Error} Throws an error if the value is not truthy.
 */
export function assert (value, message) {
	if (message) nodeAssert(value, message)
	else nodeAssert(value)
}

/**
 * Asserts that the value is a function or a Function object.
 * @param {unknown} value - The value to assert.
 * @returns {asserts value is Function} Nothing; past the call the value is known to be a function.
 * @throws {Error} Throws an error if the value is not a function.
 */
export function assertFunction (value) {
	nodeAssert(isFunction(value), `"${value}" must be a function`)
}

/**
 * Asserts that the value is a string or a String object.
 * @param {unknown} value - The value to assert.
 * @returns {asserts value is string} Nothing; past the call the value is known to be a string.
 * @throws {Error} Throws an error if the value is not a string.
 */
export function assertString (value) {
	nodeAssert(isString(value), `"${value}" must be a string`)
}
