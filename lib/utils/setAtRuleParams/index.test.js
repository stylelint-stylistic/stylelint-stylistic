import { parse } from "postcss"
import { describe, expect, it } from "vitest"

import { setAtRuleParams } from "./index.js"

describe(`setAtRuleParams`, () => {
	it(`has no comment in the params`, () => {
		let node = atRule(`@media screen {}`)

		setAtRuleParams(node, `print`)

		expect(node.params).toBe(`print`)
		expect(node.toString()).toBe(`@media print {}`)
	})

	it(`has a comment inside the params`, () => {
		let node = atRule(`@mixin foo(\n\t/* c */\n\t$bar: 1\n) {}`)

		setAtRuleParams(node, `foo(\n\t/* c */\n\t$bar: 2\n)`)

		expect(node.toString()).toBe(`@mixin foo(\n\t/* c */\n\t$bar: 2\n) {}`)
	})

	it(`keeps the cleaned params untouched when a comment was dropped from them`, () => {
		let node = atRule(`@mixin foo(\n\t/* c */\n\t$bar: 1\n) {}`)

		setAtRuleParams(node, `foo(\n\t/* c */\n\t$bar: 2\n)`)

		expect(node.params).toBe(`foo(\n\t\n\t$bar: 1\n)`)
	})

	it(`returns the at-rule it was given`, () => {
		let node = atRule(`@media screen {}`)

		expect(setAtRuleParams(node, `print`)).toBe(node)
	})
})

function atRule (css) {
	let list = []

	parse(css).walkAtRules((rule) => list.push(rule))

	return list[0]
}
