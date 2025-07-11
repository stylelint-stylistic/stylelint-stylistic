import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { isScssVariable } from "./index.js"

describe(`isScssVariable`, () => {
	it(`sass variable`, () => {
		equal(isScssVariable(`$sass-variable`), true)
	})
	it(`sass variable within namespace`, () => {
		equal(isScssVariable(`namespace.$sass-variable`), true)
	})
	it(`sass interpolation`, () => {
		equal(isScssVariable(`#{$Attr}-color`), false)
	})
	it(`single word property`, () => {
		equal(isScssVariable(`top`), false)
	})
	it(`hyphenated property`, () => {
		equal(isScssVariable(`border-top-left-radius`), false)
	})
	it(`property with vendor prefix`, () => {
		equal(isScssVariable(`-webkit-appearance`), false)
	})
	it(`custom property`, () => {
		equal(isScssVariable(`--custom-property`), false)
	})
	it(`less variable`, () => {
		equal(isScssVariable(`@var`), false)
	})
	it(`less append property value with comma`, () => {
		equal(isScssVariable(`transform+`), false)
	})
	it(`less append property value with space`, () => {
		equal(isScssVariable(`transform+_`), false)
	})
})
