import { parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { addEmptyLineAfter } from "./index.ts"

describe(`addEmptyLineAfter`, () => {
	it(`adds single newline to the newline at the beginning`, () => {
		expect(run(`a {\n}`)).toBe(`a {\n\n}`)
	})

	it(`adds single newline to newline at the beginning with CRLF`, () => {
		expect(run(`a {\r\n}`)).toBe(`a {\r\n\r\n}`)
	})

	it(`adds single newline to newline at the end`, () => {
		expect(run(`a {\t\n}`)).toBe(`a {\t\n\n}`)
	})

	it(`adds single newline to newline at the end with CRLF`, () => {
		expect(run(`a {\t\r\n}`)).toBe(`a {\t\r\n\r\n}`)
	})

	it(`adds single newline to newline in the middle`, () => {
		expect(run(`a {  \n\t}`)).toBe(`a {  \n\n\t}`)
	})

	it(`adds single newline to newline in the middle with CRLF`, () => {
		expect(run(`a {  \r\n\t}`)).toBe(`a {  \r\n\r\n\t}`)
	})

	it(`a bare carriage return or a form feed in front of the closing brace, which is whitespace and no break, so that a line is written behind it`, () => {
		expect(run(`a {\r}`)).toBe(`a {\r\n\n}`)
		expect(run(`a {\f\t}`)).toBe(`a {\f\t\n\n}`)
	})

	it(`adds two newlines if there aren't any existing newlines`, () => {
		expect(run(`a {  }`)).toBe(`a {  \n\n}`)
	})

	it(`adds two newlines if there aren't any newlines after semicolon`, () => {
		expect(run(`a {\n;}`)).toBe(`a {\n;\n\n}`)
	})

	it(`adds two newlines if there aren't any newlines after semicolon with CRLF`, () => {
		expect(run(`a {\r\n;}`)).toBe(`a {\r\n;\r\n\r\n}`)
	})

	it(`writes behind a stray semicolon rather than in front of it`, () => {
		expect(run(`a {color: pink;;\n;\n}`)).toBe(`a {color: pink;;\n;\n\n}`)
	})

	it(`writes the break the file ends its lines with where the whitespace in front of the brace holds none`, () => {
		expect(run(`a {\r\ncolor: pink;}`)).toBe(`a {\r\ncolor: pink;\r\n\r\n}`)
		expect(run(`a {b {\r\ncolor: pink;\r\n}}`)).toBe(`a {b {\r\ncolor: pink;\r\n}\r\n\r\n}`)
		expect(run(`x {y: 1;}\r\na {b: pink;}`, 1)).toBe(`x {y: 1;}\r\na {b: pink;\r\n\r\n}`)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/267
	it(`writes that break where it stands outside every raw the whitespace of the tree is kept in`, () => {
		expect(run(`a {b,\r\nc {color: pink;}}`)).toBe(`a {b,\r\nc {color: pink;}\r\n\r\n}`)
		expect(run(`a {color: pink !\r\nimportant;}`)).toBe(`a {color: pink !\r\nimportant;\r\n\r\n}`)
	})

	it(`reads that break off the file rather than off the block, where the two are written differently`, () => {
		expect(run(`a,\nb {\r\ncolor: pink;}`)).toBe(`a,\nb {\r\ncolor: pink;\n\n}`)
	})

	it(`writes a line feed where the file ends no line at all`, () => {
		expect(run(`a {color: pink;}`)).toBe(`a {color: pink;\n\n}`)
	})

	it(`writes the break the linebreaks rule asks for, whatever the file spells its lines with`, () => {
		expect(run(`a {}\nb {}`, 0, { "@stylistic/linebreaks": `windows` })).toBe(`a {\r\n\r\n}\nb {}`)
		expect(run(`a {}\r\nb {}`, 0, { "@stylistic/linebreaks": `unix` })).toBe(`a {\n\n}\r\nb {}`)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
	it(`writes the whitespace an at-rule with neither a block nor a semicolon swallowed`, () => {
		expect(run(`a {\n\t@extend .b\n}`)).toBe(`a {\n\t@extend .b\n\n}`)
		expect(run(`a {@extend .b}`)).toBe(`a {@extend .b\n\n}`)
		expect(run(`a {\r\n@extend .b\r\n}`)).toBe(`a {\r\n@extend .b\r\n\r\n}`)
	})

	it(`leaves the comment such an at-rule swallowed exactly where it stands`, () => {
		expect(run(`a {\n\t@extend .b\n\t/* c */\n}`)).toBe(`a {\n\t@extend .b\n\t/* c */\n\n}`)
	})
})

/**
 * Runs the fix over one statement of a stylesheet and prints what it left.
 * @param css - The stylesheet.
 * @param index - Which statement of it, counted from the top.
 * @param rules - The rules the configuration lists.
 * @returns The stylesheet as it prints after the fix.
 */
function run (css: string, index: number = 0, rules: Record<string, unknown> = {}): string {
	let root = parse(css)

	addEmptyLineAfter(root.nodes[index] as Rule, { stylelint: { config: { rules } } } as unknown as PostcssResult)

	return root.toString()
}
