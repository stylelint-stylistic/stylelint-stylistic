import { describe, it } from "node:test"
import { equal } from "node:assert/strict"

import isStandardSyntaxValue from "./isStandardSyntaxValue.js"

describe(`isStandardSyntaxValue`, () => {
	it(`keyword`, () => {
		equal(isStandardSyntaxValue(`initial`), true)
	})
	it(`svg keyword`, () => {
		equal(isStandardSyntaxValue(`currentColor`), true)
	})
	it(`dimension`, () => {
		equal(isStandardSyntaxValue(`10px`), true)
	})
	it(`angle`, () => {
		equal(isStandardSyntaxValue(`45deg`), true)
	})
	it(`scss var`, () => {
		equal(isStandardSyntaxValue(`$sass-variable`), false)
	})
	it(`scss namespace`, () => {
		equal(isStandardSyntaxValue(`namespace.$sass-variable`), false)
	})
	it(`negative scss var`, () => {
		equal(isStandardSyntaxValue(`-$sass-variable`), false)
	})
	it(`positive scss var`, () => {
		equal(isStandardSyntaxValue(`+$sass-variable`), false)
	})
	it(`less var`, () => {
		equal(isStandardSyntaxValue(`@less-variable`), false)
	})
	it(`negative less var`, () => {
		equal(isStandardSyntaxValue(`-@less-variable`), false)
	})
	it(`scss interpolation`, () => {
		equal(isStandardSyntaxValue(`#{$var}`), false)
	})
	it(`negative scss interpolation`, () => {
		equal(isStandardSyntaxValue(`-#{$var}`), false)
	})
	it(`less interpolation`, () => {
		equal(isStandardSyntaxValue(`@{var}`), false)
	})
	it(`WebExtension replacement keyword`, () => {
		equal(isStandardSyntaxValue(`__MSG_@@bidi_dir__`), false)
	})
	it(`negative WebExtension replacement keyword`, () => {
		equal(isStandardSyntaxValue(`__msg_@@bidi_dir__`), true)
	})
})
