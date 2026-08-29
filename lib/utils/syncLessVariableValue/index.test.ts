import postcss from "postcss"
import postcssLess from "postcss-less"
import { describe, expect, it } from "vitest"

import { syncLessVariableValue } from "./index.ts"

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

/**
 * Reads the first at-rule of a stylesheet.
 * @param code - The stylesheet.
 * @param parser - The syntax to read it with.
 * @returns That at-rule.
 */
function atRule (code: string, parser: { parse: import("postcss").Parser } = postcss): import("postcss").AtRule {
	let list: import("postcss").AtRule[] = []

	parser.parse(code).walkAtRules((rule) => {
		list.push(rule)
	})

	return list[0]
}

/**
 * Reads the first at-rule of a stylesheet written in Less.
 * @param code - The stylesheet.
 * @returns That at-rule.
 */
function lessAtRule (code: string): import("postcss").AtRule {
	return atRule(code, postcssLess)
}

/**
 * Prints the stylesheet a node stands in the way Less spells it.
 * @param node - A node of that stylesheet.
 * @returns The stylesheet.
 */
function less (node: import("postcss").Node): string {
	return node.root().toString(postcssLess)
}
