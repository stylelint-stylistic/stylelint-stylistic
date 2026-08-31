import { type AtRule, parse } from "postcss"
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
