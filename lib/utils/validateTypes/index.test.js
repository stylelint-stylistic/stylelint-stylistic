import { describe, expect, it } from "vitest"

import { isBoolean, isFunction, isNullish, isNumber, isObject, isRegExp, isString } from "./index.js"

describe(`isBoolean()`, () => {
	it(`returns true when a boolean value is specified`, () => {
		expect(isBoolean(true)).toBe(true)
	})

	it(`returns true when a Boolean object is specified`, () => {
		// oxlint-disable-next-line no-new-wrappers unicorn/new-for-builtins
		expect(isBoolean(new Boolean(true))).toBe(true)
	})

	it(`returns false when a boolean value is not specified`, () => {
		expect(isBoolean(null)).toBe(false)
	})
})

describe(`isFunction()`, () => {
	it(`returns true when a function value is specified`, () => {
		expect(isFunction(() => 1)).toBe(true)
	})

	it(`returns true when a Function object is specified`, () => {
		expect(isFunction((new Function()))).toBe(true)
	})

	it(`returns false when a function value is specified`, () => {
		expect(isFunction(null)).toBe(false)
	})
})

describe(`isNullish()`, () => {
	it(`returns true when null is specified`, () => {
		expect(isNullish(null)).toBe(true)
	})

	it(`returns true when undefined is specified`, () => {
		// oxlint-disable-next-line unicorn/no-useless-undefined
		expect(isNullish(undefined)).toBe(true)
	})

	it(`returns false when neither null nor undefined is specified`, () => {
		expect(isNullish(``)).toBe(false)
	})
})

describe(`isNumber()`, () => {
	it(`returns true when a number value is specified`, () => {
		expect(isNumber(1)).toBe(true)
	})

	it(`returns true when a Number object is specified`, () => {
		// oxlint-disable-next-line no-new-wrappers unicorn/new-for-builtins
		expect(isNumber(new Number(1))).toBe(true)
	})

	it(`returns false when a number value is not specified`, () => {
		expect(isNumber(null)).toBe(false)
	})
})

describe(`isObject()`, () => {
	it(`returns true when an object is specified`, () => {
		expect(isObject({})).toBe(true)
	})

	it(`returns false when an object is not specified`, () => {
		expect(isObject(null)).toBe(false)
	})
})

describe(`isRegExp()`, () => {
	it(`returns true when a regexp value is specified`, () => {
		expect(isRegExp(/a/u)).toBe(true)
	})

	it(`returns false when a regexp value is not specified`, () => {
		expect(isRegExp(null)).toBe(false)
	})
})

describe(`isString()`, () => {
	it(`returns true when a string value is specified`, () => {
		expect(isString(``)).toBe(true)
	})

	it(`returns true when a String object is specified`, () => {
		// oxlint-disable-next-line no-new-wrappers unicorn/new-for-builtins
		expect(isString(new String(``))).toBe(true)
	})

	it(`returns false when a string value is not specified`, () => {
		expect(isString(null)).toBe(false)
	})
})
