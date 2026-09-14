import { atRule, type Container, decl, parse, type Parser, rule } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { css as core } from "../../syntaxes/css/index.ts"

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

	// See #538
	it(`reads the whitespace a custom property with no semicolon swallowed into its value`, () => {
		expect(run(`a {\n\t--b: red\n}`)).toBe(`\n`)
		expect(run(`a { --b: red  }`)).toBe(`  `)
		expect(run(`a { --b: red}`)).toBe(``)
		expect(run(`a { --b:\n\t}`)).toBe(`\n\t`)
	})

	it(`reads it out of the important raw where the flag stands behind the value`, () => {
		expect(run(`a { --b: red !important }`)).toBe(` `)
		expect(run(`a { --b: red !important}`)).toBe(``)
		expect(run(`a { --b: red /* c */ !important\n}`)).toBe(`\n`)
	})

	it(`reads only the whitespace, leaving the comment inside such a value in front of it`, () => {
		expect(run(`a { --b: red /* c */ }`)).toBe(` `)
		expect(run(`a { --b: red /* c */}`)).toBe(``)
	})

	it(`reads the tokenizer's whitespace alone, since a no-break space or a vertical tab is a word the value keeps`, () => {
		expect(run(`a { --b: red\u00A0 }`)).toBe(` `)
		expect(run(`a { --b: red\u00A0}`)).toBe(``)
		expect(run(`a { --b: red\v}`)).toBe(``)
	})

	it(`reads such a value's whitespace under either custom syntax, behind a line comment too`, () => {
		expect(run(`a {\n\t--b: red\n}`, scss)).toBe(`\n`)
		expect(run(`a {\n\t--b: red // c\n}`, scss)).toBe(`\n`)
		expect(run(`a {\n\t--b: red\n}`, less)).toBe(`\n`)
		expect(run(`a {\n\t--b: red // c\n}`, less)).toBe(`\n`)
	})

	it(`reads the whitespace either custom syntax files the same way`, () => {
		expect(run(`a {\n\t@include foo\n}`, scss)).toBe(`\n`)
		expect(run(`a {\n\t.m()\n}`, less)).toBe(`\n`)
	})

	it(`hands back nothing at all where the block carries no raw, PostCSS computing one of its own in its place`, () => {
		let statement = rule({ selector: `a` })

		statement.append(decl({ prop: `color`, value: `pink` }))

		expect(getBlockAfter(core, statement)).toBeUndefined()
	})

	it(`hands back nothing there whatever the block ends on, an at-rule that would have swallowed the run included`, () => {
		let statement = rule({ selector: `a` })

		statement.append(atRule({ name: `extend`, params: `.b` }))

		expect(getBlockAfter(core, statement)).toBeUndefined()
	})
})

/**
 * Reads the first statement of a stylesheet and asks the question about it.
 * @param css - The stylesheet.
 * @param syntax - The syntax to read it with, where plain CSS is not the one.
 * @returns What the util answers.
 */
function run (css: string, syntax?: { parse: Parser }): ReturnType<typeof getBlockAfter> {
	let root = syntax ? syntax.parse(css) : parse(css)

	return getBlockAfter(core, root.first as Container)
}
