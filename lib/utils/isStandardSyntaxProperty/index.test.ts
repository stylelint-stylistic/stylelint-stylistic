import { describe, expect, it } from "vitest"

import { isStandardSyntaxProperty } from "./index.ts"

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
})
