import { parse } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { setBlockAfter } from "./index.js"

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

	it(`writes the whitespace either custom syntax files the same way`, () => {
		expect(run(`a {\n\t@include foo\n}`, ` `, scss)).toBe(`a {\n\t@include foo }`)
		expect(run(`a {\n\t.m()\n}`, ` `, less)).toBe(`a {\n\t.m() }`)
	})

	it(`hands back the statement it was given`, () => {
		let statement = /** @type {import('postcss').Rule} */ (parse(`a {\n\t@extend .b\n}`).first)

		expect(setBlockAfter(statement, ` `)).toBe(statement)
	})
})

/**
 * Writes the run behind the block of the first statement of a stylesheet and prints what that left.
 * @param {string} css - The stylesheet.
 * @param {string} after - The run to write.
 * @param {{ parse: import('postcss').Parser }} [syntax] - The syntax to read it with, where plain CSS is not the one.
 * @returns {string} The stylesheet as it prints after the write.
 */
function run (css, after, syntax) {
	let root = syntax ? syntax.parse(css) : parse(css)

	setBlockAfter(/** @type {import('postcss').Container} */ (root.first), after)

	return syntax ? root.toString(syntax) : root.toString()
}
