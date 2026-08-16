import { parse } from "postcss"
import html from "postcss-html"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { isInlineStyleAttribute } from "./index.js"

describe(`isInlineStyleAttribute`, () => {
	it(`the root of a style attribute`, () => {
		expect(parentsOf(html, `<div style="color: pink;">x</div>`)).toEqual([true])
		expect(parentsOf(html, `<div style="color: pink;top: 0;">x</div>`)).toEqual([true, true])
	})

	it(`a rule inside a style element`, () => {
		expect(parentsOf(html, `<style>a { color: pink; }</style>`)).toEqual([false])
	})

	it(`the root of a style element`, () => {
		expect(parentsOf(html, `<style lang="scss">$a: 1;</style>`)).toEqual([false])
	})

	it(`the root of a stylesheet`, () => {
		expect(parentsOf(scss, `$a: 1;`)).toEqual([false])
		expect(parentsOf({ parse }, `a: 1;`)).toEqual([false])
	})

	it(`a rule of a stylesheet`, () => {
		expect(parentsOf({ parse }, `a { color: pink; }`)).toEqual([false])
	})
})

/**
 * Parses the code and tells, for every declaration in it, whether its parent is a style attribute.
 * @param {{ parse: (css: string) => import('postcss').Root | import('postcss').Document }} syntax - The syntax to parse with.
 * @param {string} code - The code to parse.
 * @returns {boolean[]} One verdict per declaration, in document order.
 */
function parentsOf (syntax, code) {
	/** @type {boolean[]} */
	let verdicts = []

	syntax.parse(code).walkDecls((decl) => {
		verdicts.push(isInlineStyleAttribute(decl.parent))
	})

	return verdicts
}
