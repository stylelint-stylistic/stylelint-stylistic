import { assert as nodeAssert } from "node:console"

/**
 * Checks for a boolean or a Boolean object.
 * @param value - Anything, read by its object tag.
 * @returns True for a boolean.
 */
export function isBoolean (value: unknown): value is boolean {
	// The tag answers for the wrapper too, and across realms
	return Object.prototype.toString.call(value) === `[object Boolean]`
}

/**
 * Checks for a callable; a function has no wrapper object, so `typeof` suffices.
 * @param value - Anything, read by its type.
 * @returns True for a function.
 */
export function isFunction (value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === `function`
}

/**
 * Checks for null or undefined.
 * @param value - Anything, compared to both.
 * @returns True for a nullish value.
 */
export function isNullish (value: unknown): value is null | undefined {
	return value === null || value === undefined
}

/**
 * Checks for a number or a Number object.
 * @param value - Anything, read by its object tag.
 * @returns True for a number.
 */
export function isNumber (value: unknown): value is number {
	return Object.prototype.toString.call(value) === `[object Number]`
}

/**
 * Checks for an object.
 * @param value - Anything; null is refused, an array passes.
 * @returns True for an object.
 */
export function isObject (value: unknown): value is object {
	return value !== null && typeof value === `object`
}

/**
 * Checks for a regular expression.
 * @param value - Anything, tested with `instanceof`.
 * @returns True for a RegExp.
 */
export function isRegExp (value: unknown): value is RegExp {
	return value instanceof RegExp
}

/**
 * Checks for a string or a String object.
 * @param value - Anything, read by its object tag.
 * @returns True for a string.
 */
export function isString (value: unknown): value is string {
	return Object.prototype.toString.call(value) === `[object String]`
}

/**
 * Asserts that the value is truthy.
 * @param value - What must be truthy.
 * @param message - The text of the error thrown on a falsy value.
 * @returns Nothing.
 * @throws {Error} Where the value is falsy.
 */
export function assert (value: unknown, message?: string): asserts value {
	if (message) nodeAssert(value, message)
	else nodeAssert(value)
}

/**
 * Asserts that the value is a function.
 * @param value - What must be callable.
 * @returns Nothing.
 * @throws {Error} Where it is not.
 */
export function assertFunction (value: unknown): asserts value is (...args: unknown[]) => unknown {
	nodeAssert(isFunction(value), `"${value}" must be a function`)
}

/**
 * Asserts that the value is a string or a String object.
 * @param value - What must pass {@link isString}.
 * @returns Nothing.
 * @throws {Error} Where it is not.
 */
export function assertString (value: unknown): asserts value is string {
	nodeAssert(isString(value), `"${value}" must be a string`)
}
