import { parse } from "postcss"
import { describe, expect, it } from "vitest"

import { atRuleParamIndex } from "./index.ts"

describe(`atRuleParamIndex`, () => {
	it(`has a single space before the param`, () => {
		expect(atRuleParamIndex(atRule(`@media (color) {}`))).toBe(7)
	})

	it(`has multiple spaces before the param`, () => {
		expect(atRuleParamIndex(atRule(`@media  (color) {}`))).toBe(8)
	})

	it(`has a newline before the param`, () => {
		expect(atRuleParamIndex(atRule(`@import\n'x.css');`))).toBe(8)
	})

	it(`has a function param`, () => {
		expect(atRuleParamIndex(atRule(`@document url-prefix(http://www.w3.org/Style/)`))).toBe(10)
	})
})

/**
 * Reads the first at-rule of a stylesheet.
 * @param {string} css - The stylesheet.
 * @returns {import('postcss').AtRule} That at-rule.
 */
function atRule (css) {
	/** @type {import('postcss').AtRule[]} */
	let list = []

	parse(css).walkAtRules((rule) => {
		list.push(rule)
	})

	return list[0]
}
