import { type AtRule, parse } from "postcss"
import { parse as parseScss, stringify as stringifyScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import type { SyntaxRaw } from "../typeGuards/index.ts"

import { setAtRuleParams } from "./index.ts"

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

	it(`writes the copy the syntax prints`, () => {
		let node = scssAtRule(`@media screen // c\n  and (min-width: 1px) {}`)

		setAtRuleParams(node, `screen // c\n  and (min-width: 2px)`)

		expect((node.raws.params as SyntaxRaw).scss).toBe(`screen // c\n  and (min-width: 2px)`)
	})

	it(`keeps the raw beside it in step`, () => {
		let node = scssAtRule(`@media screen // c\n  and (min-width: 1px) {}`)

		setAtRuleParams(node, `screen // c\n  and (min-width: 2px)`)

		expect((node.raws.params as SyntaxRaw).raw).toBe(`screen /* c*/\n  and (min-width: 2px)`)
	})

	it(`the syntax prints what was written`, () => {
		let root = parseScss(`@media screen // c\n  and (min-width: 1px) {}`)

		root.walkAtRules((node) => {
			setAtRuleParams(node, `screen // c\n  and (min-width: 2px)`)
		})

		expect(root.toString(stringifyScss)).toBe(`@media screen // c\n  and (min-width: 2px) {}`)
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
