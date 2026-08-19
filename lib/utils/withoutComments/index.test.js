import { describe, expect, it } from "vitest"

import { commentsRemovedBefore, withoutComments } from "./index.js"

describe(`withoutComments`, () => {
	it(`no comment`, () => {
		expect(withoutComments(`1px, 2px`)).toBe(`1px, 2px`)
	})

	it(`a comment whitespace follows`, () => {
		expect(withoutComments(`1px, /*c*/ 2px`)).toBe(`1px, 2px`)
	})

	it(`a comment the text ends on`, () => {
		expect(withoutComments(`1px, 2px /*c*/`)).toBe(`1px, 2px`)
	})

	it(`a comment code follows straight away`, () => {
		expect(withoutComments(`1 /*c*/, 1`)).toBe(`1 /*c*/, 1`)
	})

	it(`every comment of a text, and not the first alone`, () => {
		expect(withoutComments(`1px /*a*/ , 2px /*b*/ , 3px`)).toBe(`1px , 2px , 3px`)
	})

	it(`a comment closing where the next one opens`, () => {
		expect(withoutComments(`1px /*a*/ /*b*/ , 2px`)).toBe(`1px , 2px`)
	})

	it(`a comment whose text spells the end of another`, () => {
		expect(withoutComments(`1px /*a*/, 2px /*b*/ , 3px`)).toBe(`1px /*a*/, 2px , 3px`)
	})

	it(`a run that only looks like a comment inside a string`, () => {
		expect(withoutComments(`"a/*b", "c*/d", 1px`)).toBe(`"a/*b", "c*/d", 1px`)
	})

	it(`an inline comment, which its line break closes`, () => {
		expect(withoutComments(`1px , // c\n2px`)).toBe(`1px ,\n2px`)
	})

	it(`a double slash belonging to an address`, () => {
		expect(withoutComments(`url(http://x) , 2px`)).toBe(`url(http://x) , 2px`)
	})

	it(`a line break in front of a comment stays where it is`, () => {
		expect(withoutComments(`1px\n/*c*/ , 2px`)).toBe(`1px\n , 2px`)
	})
})

describe(`commentsRemovedBefore`, () => {
	it(`nothing removed`, () => {
		expect(commentsRemovedBefore(`1px, 2px`, 4)).toBe(0)
	})

	it(`a comment standing in front of the index`, () => {
		expect(commentsRemovedBefore(`1px /*c*/ , 2px`, 10)).toBe(6)
	})

	it(`a comment standing behind the index`, () => {
		expect(commentsRemovedBefore(`1px , /*c*/ 2px`, 4)).toBe(0)
	})

	it(`a comment code follows straight away, which is removed from nothing`, () => {
		expect(commentsRemovedBefore(`1 /*c*/, 1`, 7)).toBe(0)
	})
})
