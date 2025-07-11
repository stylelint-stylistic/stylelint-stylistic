import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { parse } from "postcss"

import { atRuleParamIndex } from "./index.js"

describe(`atRuleParamIndex`, () => {
	it(`has a single space before the param`, () => {
		equal(atRuleParamIndex(atRule(`@media (color) {}`)), 7)
	})

	it(`has multiple spaces before the param`, () => {
		equal(atRuleParamIndex(atRule(`@media  (color) {}`)), 8)
	})

	it(`has a newline before the param`, () => {
		equal(atRuleParamIndex(atRule(`@import\n'x.css');`)), 8)
	})

	it(`has a function param`, () => {
		equal(atRuleParamIndex(atRule(`@document url-prefix(http://www.w3.org/Style/)`)), 10)
	})
})

function atRule (css) {
	let list = []

	parse(css).walkAtRules((rule) => list.push(rule))

	return list[0]
}
