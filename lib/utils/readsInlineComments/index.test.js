import { parse } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { syntaxKeepsInlineComments, syntaxSpellsInlineComments } from "./index.js"

describe(`syntaxSpellsInlineComments`, () => {
	it(`no syntax at all, which is plain CSS`, () => {
		expect(syntaxSpellsInlineComments()).toBe(false)
	})

	it(`something that cannot be asked, which is answered as anything that says nothing`, () => {
		expect(syntaxSpellsInlineComments({})).toBe(true)
	})

	it(`a syntax that throws on the probe`, () => {
		expect(syntaxSpellsInlineComments({ parse () { throw new Error(`no`) } })).toBe(true)
	})

	it(`a host language, which finds no stylesheet in a bare one`, () => {
		expect(syntaxSpellsInlineComments({ parse: () => parse(``) })).toBe(true)
	})

	it(`plain CSS, which spells no comment with a double slash`, () => {
		expect(syntaxSpellsInlineComments({ parse })).toBe(false)
	})

	it(`a syntax that rewrites its inline comments as it parses`, () => {
		expect(syntaxSpellsInlineComments(scss)).toBe(true)
	})

	it(`a syntax that leaves them standing`, () => {
		expect(syntaxSpellsInlineComments(less)).toBe(true)
	})
})

describe(`syntaxKeepsInlineComments`, () => {
	it(`no syntax at all`, () => {
		expect(syntaxKeepsInlineComments()).toBe(false)
	})

	it(`a syntax that rewrites them out of the value a rule reads`, () => {
		expect(syntaxKeepsInlineComments(scss)).toBe(false)
	})

	it(`a syntax that leaves them in the value`, () => {
		expect(syntaxKeepsInlineComments(less)).toBe(true)
	})
})
