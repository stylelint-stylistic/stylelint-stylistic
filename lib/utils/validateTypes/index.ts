import { assert as nodeAssert } from "node:console"

/**
 * Checks if the value is a boolean or a Boolean object.
 * @param value - The value to check.
 * @returns True if the value is a boolean, false otherwise.
 */
export function isBoolean (value: unknown): value is boolean {
	// The tag answers for the primitive and for the wrapper alike, which `typeof` alone does not, and reaches across realms, which `instanceof` does not.
	return Object.prototype.toString.call(value) === `[object Boolean]`
}

/**
 * Checks if the value is callable, however it was made — an arrow, a method, a class, one built by `new Function()`, an async one or a generator.
 *
 * A function has no wrapper object of its own the way a boolean or a string does, so `typeof` is the whole answer here.
 * @param value - The value to check.
 * @returns True if the value can be called, false otherwise.
 */
export function isFunction (value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === `function`
}

/**
 * Checks if the value is *nullish*.
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Nullish
 * @param value - The value to check.
 * @returns True if the value is null or undefined, false otherwise.
 */
export function isNullish (value: unknown): value is null | undefined {
	return value === null || value === undefined
}

/**
 * Checks if the value is a number or a Number object.
 * @param value - The value to check.
 * @returns True if the value is a number, false otherwise.
 */
export function isNumber (value: unknown): value is number {
	return Object.prototype.toString.call(value) === `[object Number]`
}

/**
 * Checks if the value is an object.
 * @param value - The value to check.
 * @returns True if the value is an object, false otherwise.
 */
export function isObject (value: unknown): value is object {
	return value !== null && typeof value === `object`
}

/**
 * Checks if the value is a regular expression.
 * @param value - The value to check.
 * @returns True if the value is a RegExp, false otherwise.
 */
export function isRegExp (value: unknown): value is RegExp {
	return value instanceof RegExp
}

/**
 * Checks if the value is a string or a String object.
 * @param value - The value to check.
 * @returns True if the value is a string, false otherwise.
 */
export function isString (value: unknown): value is string {
	return Object.prototype.toString.call(value) === `[object String]`
}

/**
 * Asserts that the value is truthy.
 * @param value - The value to assert.
 * @param message - The error message to display if the assertion fails.
 * @returns Nothing; past the call the value is known to be truthy.
 * @throws {Error} Throws an error if the value is not truthy.
 */
export function assert (value: unknown, message?: string): asserts value {
	if (message) nodeAssert(value, message)
	else nodeAssert(value)
}

/**
 * Asserts that the value is a function or a Function object.
 * @param value - The value to assert.
 * @returns Nothing; past the call the value is known to be a function.
 * @throws {Error} Throws an error if the value is not a function.
 */
export function assertFunction (value: unknown): asserts value is (...args: unknown[]) => unknown {
	nodeAssert(isFunction(value), `"${value}" must be a function`)
}

/**
 * Asserts that the value is a string or a String object.
 * @param value - The value to assert.
 * @returns Nothing; past the call the value is known to be a string.
 * @throws {Error} Throws an error if the value is not a string.
 */
export function assertString (value: unknown): asserts value is string {
	nodeAssert(isString(value), `"${value}" must be a string`)
}
