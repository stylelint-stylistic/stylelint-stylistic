import { describe, expect, it } from "vitest"

import { isStandardSyntaxValue } from "./index.js"

describe(`isStandardSyntaxValue`, () => {
	it(`keyword`, () => {
		expect(isStandardSyntaxValue(`initial`)).toBe(true)
	})
	it(`svg keyword`, () => {
		expect(isStandardSyntaxValue(`currentColor`)).toBe(true)
	})
	it(`dimension`, () => {
		expect(isStandardSyntaxValue(`10px`)).toBe(true)
	})
	it(`angle`, () => {
		expect(isStandardSyntaxValue(`45deg`)).toBe(true)
	})
	it(`scss var`, () => {
		expect(isStandardSyntaxValue(`$sass-variable`)).toBe(false)
	})
	it(`scss namespace`, () => {
		expect(isStandardSyntaxValue(`namespace.$sass-variable`)).toBe(false)
	})
	it(`negative scss var`, () => {
		expect(isStandardSyntaxValue(`-$sass-variable`)).toBe(false)
	})
	it(`positive scss var`, () => {
		expect(isStandardSyntaxValue(`+$sass-variable`)).toBe(false)
	})
	it(`less var`, () => {
		expect(isStandardSyntaxValue(`@less-variable`)).toBe(false)
	})
	it(`negative less var`, () => {
		expect(isStandardSyntaxValue(`-@less-variable`)).toBe(false)
	})
	it(`scss interpolation`, () => {
		expect(isStandardSyntaxValue(`#{$var}`)).toBe(false)
	})
	it(`negative scss interpolation`, () => {
		expect(isStandardSyntaxValue(`-#{$var}`)).toBe(false)
	})
	it(`less interpolation`, () => {
		expect(isStandardSyntaxValue(`@{var}`)).toBe(false)
	})
	it(`WebExtension replacement keyword`, () => {
		expect(isStandardSyntaxValue(`__MSG_@@bidi_dir__`)).toBe(false)
	})
	it(`negative WebExtension replacement keyword`, () => {
		expect(isStandardSyntaxValue(`__msg_@@bidi_dir__`)).toBe(true)
	})
})
