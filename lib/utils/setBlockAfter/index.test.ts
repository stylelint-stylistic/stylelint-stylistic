import { type Container, parse, type Parser, type Rule } from "postcss"
import less from "postcss-less"
import scss, { parse as scssParse } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { css as core } from "../../syntaxes/css/index.ts"

import { setBlockAfter } from "./index.ts"

describe(`setBlockAfter`, () => {
	it(`writes the block's own raw where the parser filed the run there`, () => {
		expect(run(`a {\n\tcolor: pink\n}`, ` `)).toBe(`a {\n\tcolor: pink }`)
		expect(run(`a { color: pink; }`, ``)).toBe(`a { color: pink;}`)
	})

	it(`writes the whitespace an at-rule with neither a block nor a semicolon swallowed`, () => {
		expect(run(`a {\n\t@extend .b\n}`, ` `)).toBe(`a {\n\t@extend .b }`)
		expect(run(`a {\n\t@extend .b\n}`, ``)).toBe(`a {\n\t@extend .b}`)
		expect(run(`a { @extend .b}`, `\n`)).toBe(`a { @extend .b\n}`)
	})

	it(`leaves the comment such an at-rule swallowed exactly where it stands`, () => {
		expect(run(`a {\n\t@extend .b\n\t/* c */\n}`, ` `)).toBe(`a {\n\t@extend .b\n\t/* c */ }`)
		expect(run(`a { @extend .b /* c */ }`, ``)).toBe(`a { @extend .b /* c */}`)
	})

	it(`writes the whitespace a custom property with no semicolon swallowed into its value`, () => {
		expect(run(`a {\n\t--b: red\n}`, ` `)).toBe(`a {\n\t--b: red }`)
		expect(run(`a { --b: red }`, ``)).toBe(`a { --b: red}`)
		expect(run(`a { --b: red}`, `\n`)).toBe(`a { --b: red\n}`)
		expect(run(`a { --b:\n\t}`, ` `)).toBe(`a { --b: }`)
	})

	it(`writes it into the important raw where the flag stands behind the value`, () => {
		expect(run(`a { --b: red !important }`, ``)).toBe(`a { --b: red !important}`)
		expect(run(`a { --b: red !important}`, `\n`)).toBe(`a { --b: red !important\n}`)
	})

	it(`leaves the comment inside such a value exactly where it stands`, () => {
		expect(run(`a { --b: red /* c */ }`, `\n`)).toBe(`a { --b: red /* c */\n}`)
		expect(run(`a { --b: red /* c */}`, ` `)).toBe(`a { --b: red /* c */ }`)
	})

	it(`writes over the tokenizer's whitespace alone, leaving a no-break space to the value`, () => {
		expect(run(`a { --b: red\u00A0 }`, ``)).toBe(`a { --b: red\u00A0}`)
	})

	it(`writes such a value under either custom syntax, keeping the copies behind a line comment in step`, () => {
		expect(run(`a {\n\t--b: red // c\n}`, `\n\t`, scss)).toBe(`a {\n\t--b: red // c\n\t}`)
		expect(run(`a {\n\t--b: red // c\n}`, `\n\t`, less)).toBe(`a {\n\t--b: red // c\n\t}`)

		let root = scssParse(`a {\n\t--b: red // c\n}`)

		setBlockAfter(core, root.first as Container, `\n\t`)

		// The comment-less copy is the parser's, left as it stands
		expect((root.first as Rule).last?.raws.value).toEqual({ raw: `red /* c*/\n\t`, scss: `red // c\n\t`, value: `red \n` })
	})

	it(`writes the whitespace either custom syntax files the same way`, () => {
		expect(run(`a {\n\t@include foo\n}`, ` `, scss)).toBe(`a {\n\t@include foo }`)
		expect(run(`a {\n\t.m()\n}`, ` `, less)).toBe(`a {\n\t.m() }`)
	})

	it(`hands back the statement it was given`, () => {
		let statement = parse(`a {\n\t@extend .b\n}`).first as Rule

		expect(setBlockAfter(core, statement, ` `)).toBe(statement)
	})
})

/**
 * Writes the run behind the block of the first statement of a stylesheet and prints what that left.
 * @param css - The stylesheet.
 * @param after - The run to write.
 * @param syntax - The syntax to read it with, plain CSS unless given.
 * @returns The stylesheet as it prints after the write.
 */
function run (css: string, after: string, syntax?: { parse: Parser }): string {
	let root = syntax ? syntax.parse(css) : parse(css)

	setBlockAfter(core, root.first as Container, after)

	return syntax ? root.toString(syntax) : root.toString()
}
