import { atRule, type Container, parse, type Parser, type Rule, rule } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { lastNodeHoldsTheBlockAfter } from "./index.ts"

describe(`lastNodeHoldsTheBlockAfter`, () => {
	it(`answers for an at-rule carrying neither a block nor a semicolon`, () => {
		expect(run(`a {\n\t@extend .b\n}`)).toBe(true)
		expect(run(`a { @extend .b }`)).toBe(true)
		expect(run(`a { @extend .b}`)).toBe(true)
	})

	it(`answers for such an at-rule under either custom syntax`, () => {
		expect(run(`a {\n\t@include foo\n}`, scss)).toBe(true)
		expect(run(`a {\n\t.m()\n}`, less)).toBe(true)
	})

	it(`answers for such an at-rule that swallowed a comment along with the whitespace`, () => {
		expect(run(`a {\n\t@extend .b\n\t/* c */\n}`)).toBe(true)
	})

	it(`turns away an at-rule the block's semicolon closes, whose whitespace is the block's own`, () => {
		expect(run(`a {\n\t@extend .b;\n}`)).toBe(false)
		expect(run(`a { @extend .b ; }`)).toBe(false)
	})

	it(`turns away an at-rule carrying a block of its own`, () => {
		expect(run(`a {\n\t@media x { b: c }\n}`)).toBe(false)
		expect(run(`a {\n\t@dr: { b: c; }\n}`, less)).toBe(false)
	})

	it(`answers for a custom property with no semicolon, whose value keeps the run`, () => {
		expect(run(`a {\n\t--b: red\n}`)).toBe(true)
		expect(run(`a { --b: red }`)).toBe(true)
		expect(run(`a { --b: red}`)).toBe(true)
		expect(run(`a { --b: }`)).toBe(true)
	})

	it(`answers for such a property carrying an important flag, whose raw keeps the run instead`, () => {
		expect(run(`a { --b: red !important }`)).toBe(true)
		expect(run(`a { --b: red !important}`)).toBe(true)
	})

	it(`answers for such a property under either custom syntax`, () => {
		expect(run(`a {\n\t--b: red\n}`, scss)).toBe(true)
		expect(run(`a {\n\t--b: red\n}`, less)).toBe(true)
	})

	it(`turns away a custom property the block's semicolon closes, whose whitespace is the block's own`, () => {
		expect(run(`a {\n\t--b: red;\n}`)).toBe(false)
		expect(run(`a { --b: red ; }`)).toBe(false)
	})

	it(`turns away a plain declaration, whose trailing whitespace the parser hands back to the block`, () => {
		expect(run(`a {\n\tcolor: pink\n}`)).toBe(false)
		expect(run(`a { color: pink }`)).toBe(false)
	})

	it(`turns away a block closed by a nested rule or a comment`, () => {
		expect(run(`a {\n\tb { c: d }\n}`)).toBe(false)
		expect(run(`a {\n\t@extend .b;\n\t/* c */\n}`)).toBe(false)
	})

	it(`turns away a block holding nothing at all`, () => {
		expect(run(`a {\n}`)).toBe(false)
	})

	it(`turns away a Less mixin call carrying an important flag, whose between raw holds the run in front of the flag as well`, () => {
		expect(run(`a {\n\t.m() !important\n}`, less)).toBe(false)
		expect(run(`a {\n\t.m() !important}`, less)).toBe(false)
	})

	it(`turns away a block carrying no raw of its own, which is the one answer PostCSS computes for itself`, () => {
		let statement = rule({ selector: `a` })

		statement.append(atRule({ name: `extend`, params: `.b` }))

		expect(lastNodeHoldsTheBlockAfter(statement)).toBe(false)
	})

	it(`turns away a block whose own raw a fix has already filled, which no parse of this shape leaves anything in`, () => {
		let statement = parse(`a {\n\t@extend .b;\n}`).first as Rule

		// What `declaration-block-trailing-semicolon` under `never` leaves: the flag cleared and the whitespace where it stood
		statement.raws.semicolon = false

		expect(lastNodeHoldsTheBlockAfter(statement)).toBe(false)
	})
})

/**
 * Reads the first statement of a stylesheet and asks the question about it.
 * @param css - The stylesheet.
 * @param syntax - The syntax to read it with, plain CSS unless given.
 * @returns What the util answers.
 */
function run (css: string, syntax?: { parse: Parser }): ReturnType<typeof lastNodeHoldsTheBlockAfter> {
	let root = syntax ? syntax.parse(css) : parse(css)

	return lastNodeHoldsTheBlockAfter(root.first as Container)
}
