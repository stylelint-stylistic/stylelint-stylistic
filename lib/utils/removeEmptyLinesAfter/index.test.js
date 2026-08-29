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

	it(`leaves bare carriage returns and form feeds alone, which are whitespace and no break, so that two of them hold no empty line`, () => {
		expect(run(`a {\r\r  }`)).toBe(`a {\r\r  }`)
		expect(run(`a {\f\t\f  }`)).toBe(`a {\f\t\f  }`)
	})

	it(`leaves a lone Windows pair alone, one break being no empty line`, () => {
		expect(run(`a {\r\n  }`)).toBe(`a {\r\n  }`)
	})

	it(`keeps a stray semicolon standing between two breaks and takes the empty line`, () => {
		expect(run(`a {\n;\n}`)).toBe(`a {\n;}`)
		expect(run(`a {\r\n;\r\n}`)).toBe(`a {\r\n;}`)
		expect(run(`a {\n;;\n}`)).toBe(`a {\n;;}`)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
	it(`takes the empty line out of the whitespace an at-rule with neither a block nor a semicolon swallowed`, () => {
		expect(run(`a {\n\t@extend .b\n\n}`)).toBe(`a {\n\t@extend .b\n}`)
		expect(run(`a {\r\n@extend .b\r\n\r\n}`)).toBe(`a {\r\n@extend .b\r\n}`)
	})

	it(`leaves the comment such an at-rule swallowed exactly where it stands`, () => {
		expect(run(`a {\n\t@extend .b\n\n\t/* c */\n\n}`)).toBe(`a {\n\t@extend .b\n\n\t/* c */\n}`)
	})
})

/**
 * Runs the fix over the first statement of a stylesheet and prints what it left.
 * @param {string} css - The stylesheet.
 * @returns {string} The stylesheet as it prints after the fix.
 */
function run (css) {
	let root = parse(css)

	removeEmptyLinesAfter(/** @type {import('postcss').Rule} */ (root.nodes[0]))

	return root.toString()
}
