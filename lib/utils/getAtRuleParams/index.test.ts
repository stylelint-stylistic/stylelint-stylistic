import { type AtRule, parse } from "postcss"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"

import { getAtRuleParams } from "./index.ts"

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

/**
 * Reads the first at-rule of a stylesheet.
 * @param css - The stylesheet.
 * @returns That at-rule.
 */
function atRule (css: string): AtRule {
	let list: AtRule[] = []

	parse(css).walkAtRules((rule) => {
		list.push(rule)
	})

	return pick(list)
}

/**
 * Reads the first at-rule of a stylesheet written in SCSS.
 * @param css - The stylesheet.
 * @returns That at-rule.
 */
function scssAtRule (css: string): AtRule {
	let list: AtRule[] = []

	parseScss(css).walkAtRules((rule) => {
		list.push(rule)
	})

	return pick(list)
}
