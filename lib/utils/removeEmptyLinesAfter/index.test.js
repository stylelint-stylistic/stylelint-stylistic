import { parse } from "postcss"
import { describe, expect, it } from "vitest"

import { removeEmptyLinesAfter } from "./index.js"

describe(`removeEmptyLineBefore`, () => {
	it(`removes single newline from the newline at the beginning`, () => {
		expect(run(`a {\n\n  }`)).toBe(`a {\n  }`)
	})

	it(`removes single newline from newline at the beginning with CRLF`, () => {
		expect(run(`a {\r\n\r\n  }`)).toBe(`a {\r\n  }`)
	})

	it(`removes single newline from newline at the end`, () => {
		expect(run(`a {\t\n\n}`)).toBe(`a {\t\n}`)
	})

	it(`removes single newline from newline at the end with CRLF`, () => {
		expect(run(`a {\t\r\n\r\n}`)).toBe(`a {\t\r\n}`)
	})

	it(`removes single newline from newline in the middle`, () => {
		expect(run(`a {  \n\n\t}`)).toBe(`a {  \n\t}`)
	})

	it(`removes single newline to newline in the middle with CRLF`, () => {
		expect(run(`a {  \r\n\r\n\t}`)).toBe(`a {  \r\n\t}`)
	})

	it(`removes two newlines if there are three newlines`, () => {
		expect(run(`a {\n\n\n  }`)).toBe(`a {\n  }`)
	})

	it(`removes two newlines if there are three newlines with CRLF`, () => {
		expect(run(`a {\r\n\r\n\r\n  }`)).toBe(`a {\r\n  }`)
	})

	it(`removes three newlines if there are four newlines`, () => {
		expect(run(`a {\n\n\n\n  }`)).toBe(`a {\n  }`)
	})

	it(`removes three newlines if there are four newlines with CRLF`, () => {
		expect(run(`a {\r\n\r\n\r\n\r\n  }`)).toBe(`a {\r\n  }`)
	})

	it(`leaves one bare carriage return where two stand`, () => {
		expect(run(`a {\r\r  }`)).toBe(`a {\r  }`)
	})

	it(`leaves one form feed where two stand`, () => {
		expect(run(`a {\f\f  }`)).toBe(`a {\f  }`)
	})

	it(`leaves one break of the spelling the run opens with`, () => {
		expect(run(`a {\r\r\r  }`)).toBe(`a {\r  }`)
		expect(run(`a {\f\t\f  }`)).toBe(`a {\f  }`)
	})

	it(`leaves a lone Windows pair alone, one break being no empty line`, () => {
		expect(run(`a {\r\n  }`)).toBe(`a {\r\n  }`)
	})

	it(`keeps a stray semicolon standing between two breaks and takes the empty line`, () => {
		expect(run(`a {\n;\n}`)).toBe(`a {\n;}`)
		expect(run(`a {\r;\r}`)).toBe(`a {\r;}`)
		expect(run(`a {\n;;\n}`)).toBe(`a {\n;;}`)
	})
})

function run (css) {
	let root = parse(css)

	removeEmptyLinesAfter(root.nodes[0])

	return root.toString()
}
