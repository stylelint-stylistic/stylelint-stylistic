import { parse } from "postcss"
import { describe, expect, it } from "vitest"

import { addEmptyLineAfter } from "./index.js"

describe(`addEmptyLineAfter`, () => {
	it(`adds single newline to the newline at the beginning`, () => {
		expect(run(`a {\n}`, `\n`)).toBe(`a {\n\n}`)
	})

	it(`adds single newline to newline at the beginning with CRLF`, () => {
		expect(run(`a {\r\n}`, `\r\n`)).toBe(`a {\r\n\r\n}`)
	})

	it(`adds single newline to newline at the end`, () => {
		expect(run(`a {\t\n}`, `\n`)).toBe(`a {\t\n\n}`)
	})

	it(`adds single newline to newline at the end with CRLF`, () => {
		expect(run(`a {\t\r\n}`, `\r\n`)).toBe(`a {\t\r\n\r\n}`)
	})

	it(`adds single newline to newline in the middle`, () => {
		expect(run(`a {  \n\t}`, `\n`)).toBe(`a {  \n\n\t}`)
	})

	it(`adds single newline to newline in the middle with CRLF`, () => {
		expect(run(`a {  \r\n\t}`, `\r\n`)).toBe(`a {  \r\n\r\n\t}`)
	})

	it(`writes the bare carriage return standing in front of the closing brace`, () => {
		expect(run(`a {\r}`, `\n`)).toBe(`a {\r\r}`)
	})

	it(`writes the form feed standing in front of the closing brace`, () => {
		expect(run(`a {\f\t}`, `\n`)).toBe(`a {\f\f\t}`)
	})

	it(`adds two newlines if there aren't any existing newlines`, () => {
		expect(run(`a {  }`, `\n`)).toBe(`a {  \n\n}`)
	})

	it(`adds two newlines if there aren't any existing newlines with CRLF`, () => {
		expect(run(`a {  }`, `\r\n`)).toBe(`a {  \r\n\r\n}`)
	})

	it(`adds two newlines if there aren't any newlines after semicolon`, () => {
		expect(run(`a {\n;}`, `\n`)).toBe(`a {\n;\n\n}`)
	})

	it(`adds two newlines if there aren't any newlines after semicolon with CRLF`, () => {
		expect(run(`a {\r\n;}`, `\r\n`)).toBe(`a {\r\n;\r\n\r\n}`)
	})

	it(`writes behind a stray semicolon rather than in front of it`, () => {
		expect(run(`a {color: pink;;\n;\n}`, `\n`)).toBe(`a {color: pink;;\n;\n\n}`)
	})

	it(`writes the break the file ends its lines with where nothing follows the semicolon`, () => {
		expect(run(`a {\r;}`, `\n`)).toBe(`a {\r;\r\r}`)
	})

	it(`writes the break the file ends its lines with where the whitespace in front of the brace holds none`, () => {
		expect(run(`a {\rcolor: pink;}`, `\n`)).toBe(`a {\rcolor: pink;\r\r}`)
		expect(run(`a {b {\rcolor: pink;\r}}`, `\n`)).toBe(`a {b {\rcolor: pink;\r}\r\r}`)
		expect(run(`x {y: 1;}\ra {b: pink;}`, `\n`, 1)).toBe(`x {y: 1;}\ra {b: pink;\r\r}`)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/267
	it(`writes that break where it stands outside every raw the whitespace of the tree is kept in`, () => {
		expect(run(`a {b,\rc {color: pink;}}`, `\n`)).toBe(`a {b,\rc {color: pink;}\r\r}`)
		expect(run(`a {color: pink !\rimportant;}`, `\n`)).toBe(`a {color: pink !\rimportant;\r\r}`)
	})

	it(`reads that break off the file rather than off the block, where the two are written differently`, () => {
		expect(run(`a,\nb {\rcolor: pink;}`, `\n`)).toBe(`a,\nb {\rcolor: pink;\n\n}`)
	})

	it(`writes the given newline only where the file ends no line at all`, () => {
		expect(run(`a {color: pink;}`, `\n`)).toBe(`a {color: pink;\n\n}`)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
	it(`writes the whitespace an at-rule with neither a block nor a semicolon swallowed`, () => {
		expect(run(`a {\n\t@extend .b\n}`, `\n`)).toBe(`a {\n\t@extend .b\n\n}`)
		expect(run(`a {@extend .b}`, `\n`)).toBe(`a {@extend .b\n\n}`)
		expect(run(`a {\r@extend .b\r}`, `\n`)).toBe(`a {\r@extend .b\r\r}`)
	})

	it(`leaves the comment such an at-rule swallowed exactly where it stands`, () => {
		expect(run(`a {\n\t@extend .b\n\t/* c */\n}`, `\n`)).toBe(`a {\n\t@extend .b\n\t/* c */\n\n}`)
	})
})

function run (css, lineEnding, index = 0) {
	let root = parse(css)

	addEmptyLineAfter(root.nodes[index], lineEnding)

	return root.toString()
}
