import { parse } from "postcss"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { getLineEnding } from "./index.js"

describe(`getLineEnding`, () => {
	it(`reads a line feed`, () => {
		expect(run(`a {\ncolor: pink;\n}`)).toBe(`\n`)
	})

	it(`reads a Windows pair as the one break it is`, () => {
		expect(run(`a {\r\ncolor: pink;\r\n}`)).toBe(`\r\n`)
	})

	it(`reads a bare carriage return`, () => {
		expect(run(`a {\rcolor: pink;\r}`)).toBe(`\r`)
	})

	it(`reads a form feed`, () => {
		expect(run(`a {\fcolor: pink;\f}`)).toBe(`\f`)
	})

	it(`answers nothing about a file written on one line`, () => {
		expect(run(`a {color: pink;}`)).toBeUndefined()
	})

	it(`reads a break standing in a selector`, () => {
		expect(run(`a,\rb {color: pink;}`)).toBe(`\r`)
	})

	it(`reads a break standing in a value`, () => {
		expect(run(`a {transform: translate(1px,\r2px);}`)).toBe(`\r`)
	})

	it(`reads a break standing in a set of parameters`, () => {
		expect(run(`@media (min-width:1px),\r(max-width:2px) {a {color: pink;}}`)).toBe(`\r`)
	})

	it(`reads a break standing inside an important flag`, () => {
		expect(run(`a {color: pink !\rimportant;}`)).toBe(`\r`)
	})

	it(`reads no break out of a block comment, which says nothing about how the file ends its lines`, () => {
		expect(run(`a {color/*\r*/: pink;\ntop: 0;}`)).toBe(`\n`)
	})

	it(`answers nothing about a file whose only break stands inside a comment`, () => {
		expect(run(`a {color/*\r*/: pink;}`)).toBeUndefined()
	})

	it(`reads no break out of a quoted string`, () => {
		expect(run(`a {content: "x\ry";\ncolor: pink;}`)).toBe(`\n`)
	})

	it(`reads the form feed that closes an inline comment, which Sass ends one on`, () => {
		expect(runScss(`a {b //x\f {color: pink;}}`)).toBe(`\f`)
	})

	it(`opens no comment on the double slash of an address`, () => {
		expect(run(`a {background: url(//x.test/a.png);\rcolor: pink;}`)).toBe(`\r`)
	})

	it(`answers with the first break where a file is written with two`, () => {
		expect(run(`a,\nb {\rcolor: pink;}`)).toBe(`\n`)
	})

	it(`answers about the file whichever node of it is asked`, () => {
		let root = parse(`a {\rcolor: pink;\r}`)

		expect(getLineEnding(root.first)).toBe(`\r`)
		expect(getLineEnding(/** @type {import('postcss').Rule} */ (root.first).first)).toBe(`\r`)
	})
})

function runScss (css) {
	return getLineEnding(parseScss(css).first)
}

function run (css) {
	return getLineEnding(parse(css).first)
}
