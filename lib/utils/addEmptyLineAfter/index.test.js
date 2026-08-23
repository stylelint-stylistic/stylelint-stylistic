import { parse } from "postcss"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { addEmptyLineAfter } from "./index.js"

describe(`addEmptyLineBefore`, () => {
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

	it(`writes the bare carriage return the block is broken with, and not the newline it is given`, () => {
		expect(run(`a {\r}`, `\n`)).toBe(`a {\r\r}`)
	})

	it(`writes the form feed the block is broken with`, () => {
		expect(run(`a {\f\t}`, `\n`)).toBe(`a {\f\f\t}`)
	})

	it(`writes behind a stray semicolon rather than in front of it`, () => {
		expect(run(`a {color: pink;;\n;\n}`, `\n`)).toBe(`a {color: pink;;\n;\n\n}`)
	})

	it(`writes the break the node is spelled with where nothing follows the semicolon`, () => {
		expect(run(`a {\r;}`, `\n`)).toBe(`a {\r;\r\r}`)
	})

	it(`writes the break the node is spelled with where the whitespace holds none`, () => {
		expect(run(`a {\rcolor: pink;}`, `\n`)).toBe(`a {\rcolor: pink;\r\r}`)
	})

	it(`reads that break off the block and not off the selector`, () => {
		expect(run(`a,\nb {\rcolor: pink;}`, `\n`)).toBe(`a,\nb {\rcolor: pink;\r\r}`)
	})

	it(`reads it off the block and not out of a comment or a string standing in it`, () => {
		expect(run(`a {/*\f*/\ncolor: pink;}`, `\n`)).toBe(`a {/*\f*/\ncolor: pink;\n\n}`)
		expect(run(`a { b: "x\fy";\ncolor: pink;}`, `\n`)).toBe(`a { b: "x\fy";\ncolor: pink;\n\n}`)
	})

	it(`reads it off a nested block where the children of this one open no line`, () => {
		expect(run(`a {b {\rcolor: pink;\r}}`, `\n`)).toBe(`a {b {\rcolor: pink;\r}\r\r}`)
	})

	it(`reads it off the whitespace between a declaration's colon and its value`, () => {
		expect(run(`a {color:\rpink;}`, `\n`)).toBe(`a {color:\rpink;\r\r}`)
	})

	it(`reads it off the whitespace behind an at-rule's name, and off the semicolon a nested block is followed by`, () => {
		expect(run(`a {@media\r(min-width:1px){color: pink;}}`, `\n`)).toBe(`a {@media\r(min-width:1px){color: pink;}\r\r}`)
		expect(run(`a {b {color: pink}\r;}`, `\n`)).toBe(`a {b {color: pink}\r;\r\r}`)
	})

	it(`reads it past a comment standing in the same raw as the whitespace`, () => {
		expect(run(`a {b/*x*/\r{color: pink;}}`, `\n`)).toBe(`a {b/*x*/\r{color: pink;}\r\r}`)
		expect(run(`a {color/*x*/:\rpink;}`, `\n`)).toBe(`a {color/*x*/:\rpink;\r\r}`)
	})

	it(`reads no break out of a comment, which says nothing about how the file ends its lines`, () => {
		expect(run(`a {color/*\r*/: pink;\ntop: 0;}`, `\n`)).toBe(`a {color/*\r*/: pink;\ntop: 0;\n\n}`)
	})

	it(`reads the form feed that closes an inline comment, which Sass ends one on`, () => {
		expect(runScss(`a {b //x\f {color: pink;}}`, `\n`)).toBe(`a {b //x\f {color: pink;}\f\f}`)
	})

	it(`reads the semicolon the node itself is followed by`, () => {
		expect(run(`a {b,\rc {d: pink;}}\r;`, `\n`)).toBe(`a {b,\rc {d: pink;}\r\r}\r;`)
	})

	it(`reads it off the whitespace in front of the node itself`, () => {
		expect(run(`x {y: 1;}\ra {b: pink;}`, `\n`, 1)).toBe(`x {y: 1;}\ra {b: pink;\r\r}`)
	})

	it(`writes the given newline where the only break stands in a raw the file keeps whole`, () => {
		expect(run(`a {color: pink !\rimportant;}`, `\n`)).toBe(`a {color: pink !\rimportant;\n\n}`)
		expect(run(`a {b,\rc {color: pink;}}`, `\n`)).toBe(`a {b,\rc {color: pink;}\n\n}`)
	})

	it(`writes the given newline only where the file holds no break at all`, () => {
		expect(run(`a {color: pink;}`, `\n`)).toBe(`a {color: pink;\n\n}`)
	})
})

function runScss (css, lineEnding) {
	let root = parseScss(css)

	addEmptyLineAfter(root.nodes[0], lineEnding)

	return root.toString()
}

function run (css, lineEnding, index = 0) {
	let root = parse(css)

	addEmptyLineAfter(root.nodes[index], lineEnding)

	return root.toString()
}
