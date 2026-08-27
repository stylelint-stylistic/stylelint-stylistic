import { parse } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { formFeedReadingsOwed, inlineCommentReading, syntaxKeepsInlineComments, syntaxSpellsInlineComments } from "./index.js"

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
 * @param {{ parse: Function }} [syntax] - The syntax the file was opened with, none of it standing for plain CSS.
 * @returns {import('./index.js').InlineCommentReading} What that syntax makes of such a comment.
 */
function read (syntax) {
	let root = parse(`a { color: red; }`, { from: undefined })

	return inlineCommentReading(root.first.first, { opts: { syntax } })
}

describe(`inlineCommentReading`, () => {
	it(`a syntax that ends an inline comment on a form feed, which is the reading Sass has`, () => {
		expect(read(scss).endsOnFormFeed).toBe(true)
	})

	it(`a syntax that reads no line in one, which is the reading Less has`, () => {
		expect(read(less).endsOnFormFeed).toBe(false)
	})

	it(`a host language, which finds no stylesheet in the probe and so says nothing about the character`, () => {
		expect(read({ parse: () => parse(``) }).endsOnFormFeed).toBe(undefined)
	})

	it(`a syntax that throws on both probes, which says nothing about the character either`, () => {
		expect(read({ parse () { throw new Error(`no`) } }).endsOnFormFeed).toBe(undefined)
	})

	it(`a syntax that answers the first probe and throws on the second, whose two first answers the throw leaves standing`, () => {
		let stumbles = { parse: (code, options) => code.includes(`\f`) ? (() => { throw new Error(`no`) })() : less.parse(code, options) }

		expect(read(stumbles)).toEqual({ spells: true, keeps: true, endsOnFormFeed: undefined })
	})

	it(`no syntax at all, which spells no comment for a break to end`, () => {
		expect(read()).toEqual({ spells: false, keeps: false, endsOnFormFeed: false })
	})
})

describe(`formFeedReadingsOwed`, () => {
	it(`a reading that names the language, which is owed that language's answer and no other`, () => {
		expect(formFeedReadingsOwed({ spells: true, keeps: false, endsOnFormFeed: true })).toEqual([true])
		expect(formFeedReadingsOwed({ spells: true, keeps: false, endsOnFormFeed: false })).toEqual([false])
	})

	it(`a reading that names none, which is owed both`, () => {
		expect(formFeedReadingsOwed({ spells: true, keeps: false, endsOnFormFeed: undefined })).toEqual([false, true])
	})
})
