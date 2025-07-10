import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { isStandardSyntaxProperty } from "./isStandardSyntaxProperty.js"

describe(`isStandardSyntaxProperty`, () => {
	it(`single word`, () => {
		equal(isStandardSyntaxProperty(`top`), true)
	})
	it(`custom property`, () => {
		equal(isStandardSyntaxProperty(`--custom-property`), true)
	})
	it(`hyphenated words`, () => {
		equal(isStandardSyntaxProperty(`border-top-left-radius`), true)
	})
	it(`vendor prefix`, () => {
		equal(isStandardSyntaxProperty(`-webkit-appearance`), true)
	})
	it(`sass variable`, () => {
		equal(isStandardSyntaxProperty(`$sass-variable`), false)
	})
	it(`sass variable within namespace`, () => {
		equal(isStandardSyntaxProperty(`namespace.$sass-variable`), false)
	})
	it(`sass interpolation`, () => {
		equal(isStandardSyntaxProperty(`#{$Attr}-color`), false)
	})
	it(`less variable`, () => {
		equal(isStandardSyntaxProperty(`@{Attr}-color`), false)
	})
	it(`less append property value with comma`, () => {
		equal(isStandardSyntaxProperty(`transform+`), false)
	})
	it(`less append property value with space`, () => {
		equal(isStandardSyntaxProperty(`transform+_`), false)
	})
})
