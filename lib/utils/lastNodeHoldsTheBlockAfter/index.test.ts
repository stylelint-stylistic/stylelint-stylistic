import { atRule, parse, rule } from "postcss"
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

	it(`turns away a block closed by anything but an at-rule`, () => {
		expect(run(`a {\n\tcolor: pink\n}`)).toBe(false)
		expect(run(`a {\n\tb { c: d }\n}`)).toBe(false)
		expect(run(`a {\n\t@extend .b;\n\t/* c */\n}`)).toBe(false)
	})

	it(`turns away a block holding nothing at all`, () => {
		expect(run(`a {\n}`)).toBe(false)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374
	it(`turns away a Less mixin call carrying an important flag, which that syntax prints behind the at-rule's own raw`, () => {
		expect(run(`a {\n\t.m() !important\n}`, less)).toBe(false)
		expect(run(`a {\n\t.m() !important}`, less)).toBe(false)
	})

	it(`turns away a block carrying no raw of its own, which is the one answer PostCSS computes for itself`, () => {
		let statement = rule({ selector: `a` })

		statement.append(atRule({ name: `extend`, params: `.b` }))

		expect(lastNodeHoldsTheBlockAfter(statement)).toBe(false)
	})

	it(`turns away a block whose own raw a fix has already filled, which no parse of this shape leaves anything in`, () => {
		let statement = (parse(`a {\n\t@extend .b;\n}`).first as import("postcss").Rule)

		// What `declaration-block-trailing-semicolon` under `never` leaves behind: the flag cleared and the whitespace standing where it stood
		statement.raws.semicolon = false

		expect(lastNodeHoldsTheBlockAfter(statement)).toBe(false)
	})
})

/**
 * Reads the first statement of a stylesheet and asks the question about it.
 * @param css - The stylesheet.
 * @param syntax - The syntax to read it with, where plain CSS is not the one.
 * @returns What the util answers.
 */
function run (css: string, syntax?: { parse: import("postcss").Parser }): ReturnType<typeof lastNodeHoldsTheBlockAfter> {
	let root = syntax ? syntax.parse(css) : parse(css)

	return lastNodeHoldsTheBlockAfter((root.first as import("postcss").Container))
}
