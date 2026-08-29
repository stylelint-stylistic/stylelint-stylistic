import { parse } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { inlineCommentReading, syntaxKeepsInlineComments, syntaxSpellsInlineComments } from "./index.ts"

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

/**
 * Reads what a syntax makes of an inline comment off a node.
 *
 * The stylesheet the node comes from is parsed by PostCSS itself whatever the syntax is, since the question is about the syntax the file was opened with rather than about the one that read this stylesheet, and a syntax written here to throw would throw on this too.
 * @param syntax - The syntax the file was opened with, none of it standing for plain CSS.
 * @returns What that syntax makes of such a comment.
 */
function read (syntax?: unknown): import("./index.ts").InlineCommentReading {
	let rule = parse(`a { color: red; }`, { from: undefined }).first as import("postcss").Rule

	return inlineCommentReading(rule.first as import("postcss").Declaration, { opts: { syntax } } as unknown as import("stylelint").PostcssResult)
}

describe(`inlineCommentReading`, () => {
	it(`no syntax at all, which spells no comment with a double slash`, () => {
		expect(read()).toEqual({ spells: false, keeps: false })
	})

	it(`something that cannot be asked, which is answered as anything that says nothing`, () => {
		expect(read({})).toEqual({ spells: true, keeps: false })
	})

	it(`a syntax that rewrites its inline comments out of the value a rule reads`, () => {
		expect(read(scss)).toEqual({ spells: true, keeps: false })
	})

	it(`a syntax that leaves them standing in the value`, () => {
		expect(read(less)).toEqual({ spells: true, keeps: true })
	})
})
