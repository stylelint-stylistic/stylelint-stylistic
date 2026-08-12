import { parse } from "postcss"
import { describe, expect, it } from "vitest"

import { getAtRuleParams } from "./index.js"

describe(`getAtRuleParams`, () => {
	it(`has no params`, () => {
		expect(getAtRuleParams(atRule(`@font-face {}`))).toBe(``)
	})

	it(`has no comment in the params`, () => {
		expect(getAtRuleParams(atRule(`@media screen {}`))).toBe(`screen`)
	})

	it(`has a comment in front of the params`, () => {
		expect(getAtRuleParams(atRule(`@media /* c */ screen {}`))).toBe(`screen`)
	})

	it(`has a comment inside the params`, () => {
		expect(getAtRuleParams(atRule(`@mixin foo(\n\t/* c */\n\t$bar: 1\n) {}`))).toBe(`foo(\n\t/* c */\n\t$bar: 1\n)`)
	})
})

function atRule (css) {
	let list = []

	parse(css).walkAtRules((rule) => list.push(rule))

	return list[0]
}
