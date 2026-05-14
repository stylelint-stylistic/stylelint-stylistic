import { describe, expect, it } from "vitest"

import { isStandardSyntaxProperty } from "./index.js"

describe(`isStandardSyntaxProperty`, () => {
	it(`single word`, () => {
		expect(isStandardSyntaxProperty(`top`)).toBe(true)
	})
	it(`custom property`, () => {
		expect(isStandardSyntaxProperty(`--custom-property`)).toBe(true)
	})
	it(`hyphenated words`, () => {
		expect(isStandardSyntaxProperty(`border-top-left-radius`)).toBe(true)
	})
	it(`vendor prefix`, () => {
		expect(isStandardSyntaxProperty(`-webkit-appearance`)).toBe(true)
	})
	it(`sass variable`, () => {
		expect(isStandardSyntaxProperty(`$sass-variable`)).toBe(false)
	})
	it(`sass variable within namespace`, () => {
		expect(isStandardSyntaxProperty(`namespace.$sass-variable`)).toBe(false)
	})
	it(`sass interpolation`, () => {
		expect(isStandardSyntaxProperty(`#{$Attr}-color`)).toBe(false)
	})
	it(`less variable`, () => {
		expect(isStandardSyntaxProperty(`@{Attr}-color`)).toBe(false)
	})
	it(`less append property value with comma`, () => {
		expect(isStandardSyntaxProperty(`transform+`)).toBe(false)
	})
	it(`less append property value with space`, () => {
		expect(isStandardSyntaxProperty(`transform+_`)).toBe(false)
	})
})
