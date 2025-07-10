import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { parse } from "postcss"

import { addEmptyLineAfter } from "./addEmptyLineAfter.js"

describe(`addEmptyLineBefore`, () => {
	it(`adds single newline to the newline at the beginning`, () => {
		equal(run(`a {\n}`, `\n`), `a {\n\n}`)
	})

	it(`adds single newline to newline at the beginning with CRLF`, () => {
		equal(run(`a {\r\n}`, `\r\n`), `a {\r\n\r\n}`)
	})

	it(`adds single newline to newline at the end`, () => {
		equal(run(`a {\t\n}`, `\n`), `a {\t\n\n}`)
	})

	it(`adds single newline to newline at the end with CRLF`, () => {
		equal(run(`a {\t\r\n}`, `\r\n`), `a {\t\r\n\r\n}`)
	})

	it(`adds single newline to newline in the middle`, () => {
		equal(run(`a {  \n\t}`, `\n`), `a {  \n\n\t}`)
	})

	it(`adds single newline to newline in the middle with CRLF`, () => {
		equal(run(`a {  \r\n\t}`, `\r\n`), `a {  \r\n\r\n\t}`)
	})

	it(`adds two newlines if there aren't any existing newlines`, () => {
		equal(run(`a {  }`, `\n`), `a {  \n\n}`)
	})

	it(`adds two newlines if there aren't any existing newlines with CRLF`, () => {
		equal(run(`a {  }`, `\r\n`), `a {  \r\n\r\n}`)
	})

	it(`adds two newlines if there aren't any newlines after semicolon`, () => {
		equal(run(`a {\n;}`, `\n`), `a {\n;\n\n}`)
	})

	it(`adds two newlines if there aren't any newlines after semicolon with CRLF`, () => {
		equal(run(`a {\r\n;}`, `\r\n`), `a {\r\n;\r\n\r\n}`)
	})
})

function run (css, lineEnding) {
	let root = parse(css)

	addEmptyLineAfter(root.nodes[0], lineEnding)

	return root.toString()
}
