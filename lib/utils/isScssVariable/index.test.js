import { describe, expect, it } from "vitest"

import { isScssVariable } from "./index.js"

describe(`isScssVariable`, () => {
	it(`sass variable`, () => {
		expect(isScssVariable(`$sass-variable`)).toBe(true)
	})
	it(`sass variable within namespace`, () => {
		expect(isScssVariable(`namespace.$sass-variable`)).toBe(true)
	})
	it(`sass interpolation`, () => {
		expect(isScssVariable(`#{$Attr}-color`)).toBe(false)
	})
	it(`single word property`, () => {
		expect(isScssVariable(`top`)).toBe(false)
	})
	it(`hyphenated property`, () => {
		expect(isScssVariable(`border-top-left-radius`)).toBe(false)
	})
	it(`property with vendor prefix`, () => {
		expect(isScssVariable(`-webkit-appearance`)).toBe(false)
	})
	it(`custom property`, () => {
		expect(isScssVariable(`--custom-property`)).toBe(false)
	})
	it(`less variable`, () => {
		expect(isScssVariable(`@var`)).toBe(false)
	})
	it(`less append property value with comma`, () => {
		expect(isScssVariable(`transform+`)).toBe(false)
	})
	it(`less append property value with space`, () => {
		expect(isScssVariable(`transform+_`)).toBe(false)
	})
})
