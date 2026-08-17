import { parse } from "postcss"
import { parse as parseScss } from "postcss-scss"
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

	it(`has an inline comment inside the params, which the syntax spells in a copy of its own`, () => {
		expect(getAtRuleParams(scssAtRule(`@mixin foo(\n\t// c\n\t$bar: 1\n) {}`))).toBe(`foo(\n\t// c\n\t$bar: 1\n)`)
	})
})

function atRule (css) {
	let list = []

	parse(css).walkAtRules((rule) => list.push(rule))

	return list[0]
}

function scssAtRule (css) {
	let list = []

	parseScss(css).walkAtRules((rule) => list.push(rule))

	return list[0]
}
