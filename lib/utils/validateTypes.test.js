import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { isBoolean, isFunction, isNullish, isNumber, isObject, isPlainObject, isRegExp, isString } from "./validateTypes.js"

describe(`isBoolean()`, () => {
	it(`returns true when a boolean value is specified`, () => {
		equal(isBoolean(true), true)
	})

	it(`returns true when a Boolean object is specified`, () => {
		equal(isBoolean(new Boolean(true)), true)
	})

	it(`returns false when a boolean value is not specified`, () => {
		equal(isBoolean(null), false)
	})
})

describe(`isFunction()`, () => {
	it(`returns true when a function value is specified`, () => {
		equal(isFunction(() => 1), true)
	})

	it(`returns true when a Function object is specified`, () => {
		equal(isFunction((new Function)), true)
	})

	it(`returns false when a function value is specified`, () => {
		equal(isFunction(null), false)
	})
})

describe(`isNullish()`, () => {
	it(`returns true when null is specified`, () => {
		equal(isNullish(null), true)
	})

	it(`returns true when undefined is specified`, () => {
		equal(isNullish(undefined), true)
	})

	it(`returns false when neither null nor undefined is specified`, () => {
		equal(isNullish(``), false)
	})
})

describe(`isNumber()`, () => {
	it(`returns true when a number value is specified`, () => {
		equal(isNumber(1), true)
	})

	it(`returns true when a Number object is specified`, () => {
		equal(isNumber(new Number(1)), true)
	})

	it(`returns false when a number value is not specified`, () => {
		equal(isNumber(null), false)
	})
})

describe(`isObject()`, () => {
	it(`returns true when an object is specified`, () => {
		equal(isObject({}), true)
	})

	it(`returns false when an object is not specified`, () => {
		equal(isObject(null), false)
	})
})

describe(`isRegExp()`, () => {
	it(`returns true when a regexp value is specified`, () => {
		equal(isRegExp(/a/), true)
	})

	it(`returns false when a regexp value is not specified`, () => {
		equal(isRegExp(null), false)
	})
})

describe(`isString()`, () => {
	it(`returns true when a string value is specified`, () => {
		equal(isString(``), true)
	})

	it(`returns true when a String object is specified`, () => {
		equal(isString(new String(``)), true)
	})

	it(`returns false when a string value is not specified`, () => {
		equal(isString(null), false)
	})
})

describe(`isPlainObject()`, () => {
	it(`returns true when a plain object is specified`, () => {
		equal(isPlainObject({}), true)
	})

	it(`returns false when a plain object is not specified`, () => {
		equal(isPlainObject(null), false)
	})
})
