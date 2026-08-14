import postcss from "postcss"
import postcssLess from "postcss-less"
import { describe, expect, it } from "vitest"

import { syncLessVariableValue } from "./index.js"

describe(`syncLessVariableValue`, () => {
	it(`takes a Less variable's params to the output`, () => {
		let node = lessAtRule(`@foo: "bar";`)

		node.params = `'bar'`
		syncLessVariableValue(node, node.params)

		expect(less(node)).toBe(`@foo: 'bar';`)
	})

	it(`keeps a comment that the params it is given still hold`, () => {
		let node = lessAtRule(`@foo: (\n\t/* c */\n\t"a"\n);`)

		syncLessVariableValue(node, `(\n\t/* c */\n\t'a'\n)`)

		expect(less(node)).toBe(`@foo: (\n\t/* c */\n\t'a'\n);`)
	})

	it(`leaves an ordinary at-rule alone`, () => {
		let node = lessAtRule(`@media screen {}`)

		node.params = `print`
		syncLessVariableValue(node, node.params)

		expect(`value` in node).toBe(false)
		expect(less(node)).toBe(`@media print {}`)
	})

	it(`leaves a plain CSS at-rule alone`, () => {
		let node = atRule(`@media screen {}`)

		node.params = `print`
		syncLessVariableValue(node, node.params)

		expect(`value` in node).toBe(false)
		expect(node.toString()).toBe(`@media print {}`)
	})

	it(`returns the at-rule it was given`, () => {
		let node = lessAtRule(`@foo: "bar";`)

		expect(syncLessVariableValue(node, `'bar'`)).toBe(node)
	})
})

function atRule (code, parser = postcss) {
	let list = []

	parser.parse(code).walkAtRules((rule) => list.push(rule))

	return list[0]
}

function lessAtRule (code) {
	return atRule(code, postcssLess)
}

function less (node) {
	return node.root().toString(postcssLess)
}
