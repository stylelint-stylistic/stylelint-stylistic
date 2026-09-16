import { describe, expect, it } from "vitest"

import { lengthensTheName } from "./index.ts"

let POSTCSS = { tokenizes: false }
let SCSS = { tokenizes: true }

describe(`lengthensTheName`, () => {
	it(`a sign both the tokenizer and the value parser keep in the word`, () => {
		expect(lengthensTheName(`x $`, POSTCSS)).toBe(true)
		expect(lengthensTheName(`x !`, POSTCSS)).toBe(true)
		expect(lengthensTheName(`x @`, POSTCSS)).toBe(true)
	})

	it(`a comma, a solidus or a control character, which the value parser parts from the name`, () => {
		expect(lengthensTheName(`x ,`, POSTCSS)).toBe(false)
		expect(lengthensTheName(`x /`, POSTCSS)).toBe(false)
		expect(lengthensTheName(`x \v`, POSTCSS)).toBe(false)
	})

	it(`a sign the tokenizer does not glue to the name, whitespace, a closing comment delimiter or an escaped character, and no text at all`, () => {
		expect(lengthensTheName(`x `, POSTCSS)).toBe(false)
		expect(lengthensTheName(`x /* c */`, POSTCSS)).toBe(false)
		expect(lengthensTheName(`x \\$`, POSTCSS)).toBe(false)
		expect(lengthensTheName(``, POSTCSS)).toBe(false)
	})

	it(`any sign under the parser Sass is read by, where Sass decides`, () => {
		expect(lengthensTheName(`x $`, SCSS)).toBe(false)
	})
})
