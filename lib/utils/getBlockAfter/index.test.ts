import { atRule, decl, parse, rule } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { getBlockAfter } from "./index.ts"

describe(`getBlockAfter`, () => {
	it(`reads the block's own raw where the parser filed the run there`, () => {
		expect(run(`a {\n\tcolor: pink\n}`)).toBe(`\n`)
		expect(run(`a { color: pink; }`)).toBe(` `)
		expect(run(`a { color: pink;}`)).toBe(``)
		expect(run(`a { color: pink;; }`)).toBe(`; `)
	})

	it(`reads the whitespace an at-rule with neither a block nor a semicolon swallowed`, () => {
		expect(run(`a {\n\t@extend .b\n}`)).toBe(`\n`)
		expect(run(`a { @extend .b }`)).toBe(` `)
		expect(run(`a { @extend .b}`)).toBe(``)
		expect(run(`a {\n\t@extend .b  \n\t\n}`)).toBe(`  \n\t\n`)
	})

	it(`reads only the whitespace, leaving the comment such an at-rule swallowed in front of it`, () => {
		expect(run(`a {\n\t@extend .b\n\t/* c */\n}`)).toBe(`\n`)
		expect(run(`a { @extend .b /* c */}`)).toBe(``)
	})

	it(`reads the whitespace either custom syntax files the same way`, () => {
		expect(run(`a {\n\t@include foo\n}`, scss)).toBe(`\n`)
		expect(run(`a {\n\t.m()\n}`, less)).toBe(`\n`)
	})

	it(`hands back nothing at all where the block carries no raw, PostCSS computing one of its own in its place`, () => {
		let statement = rule({ selector: `a` })

		statement.append(decl({ prop: `color`, value: `pink` }))

		expect(getBlockAfter(statement)).toBeUndefined()
	})

	it(`hands back nothing there whatever the block ends on, an at-rule that would have swallowed the run included`, () => {
		let statement = rule({ selector: `a` })

		statement.append(atRule({ name: `extend`, params: `.b` }))

		expect(getBlockAfter(statement)).toBeUndefined()
	})
})

/**
 * Reads the first statement of a stylesheet and asks the question about it.
 * @param css - The stylesheet.
 * @param syntax - The syntax to read it with, where plain CSS is not the one.
 * @returns What the util answers.
 */
function run (css: string, syntax?: { parse: import("postcss").Parser }): ReturnType<typeof getBlockAfter> {
	let root = syntax ? syntax.parse(css) : parse(css)

	return getBlockAfter((root.first as import("postcss").Container))
}
