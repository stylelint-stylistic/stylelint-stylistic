import { describe, expect, it } from "vitest"

import { movesEndIntoInlineComment } from "./index.js"

/** The reading Less has: a comment closed by a line feed and by a carriage return, and by no form feed. */
const LESS = { spells: true, keeps: true, endsOnFormFeed: false }

/** The reading Sass has, which ends such a comment on a form feed as well. */
const SASS = { spells: true, keeps: false, endsOnFormFeed: true }

/** The reading a syntax that has said nothing about the form feed leaves, which is owed both of the two. */
const NOTHING_SAID = { spells: true, keeps: false, endsOnFormFeed: undefined }

/** The reading plain CSS has, which spells no comment with a double slash at all. */
const PLAIN_CSS = { spells: false, keeps: false, endsOnFormFeed: false }

describe(`movesEndIntoInlineComment`, () => {
	it(`a line break the fix takes away, which is what closed the comment in front of the character`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c\n)`, `f(1px // c)`, LESS)).toBe(true)
	})

	it(`the same fix where the comment is closed by something the fix does not reach`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c\n2px\n)`, `f(1px // c\n2px)`, LESS)).toBe(false)
	})

	it(`a character standing inside the comment on either side of the fix, which describes a value already broken`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c )`, `f(1px // c)`, LESS)).toBe(false)
	})

	it(`a form feed the fix takes away, asked of the language that reads a line in it: the character stands outside the comment until the fix runs`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c\f)`, `f(1px // c)`, SASS)).toBe(true)
	})

	it(`the same form feed asked of the language that reads none, which has the character inside the comment on either side of the fix`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c\f)`, `f(1px // c)`, LESS)).toBe(false)
	})

	it(`the same form feed asked of a syntax that has named neither language, which is owed both readings and answers for the one that moves the character`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c\f)`, `f(1px // c)`, NOTHING_SAID)).toBe(true)
	})

	it(`a form feed standing in front of the whitespace the fix takes away: Sass ended the comment on it and has the character outside on either side of the fix, while Less reads no line in it and has the break the fix takes away as the one thing keeping the character out`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c\f2px\n)`, `f(1px // c\f2px)`, SASS)).toBe(false)
		expect(movesEndIntoInlineComment(`f(1px // c\f2px\n)`, `f(1px // c\f2px)`, LESS)).toBe(true)
	})

	it(`a fix weighed against the value it would leave rather than against the one that stands, since closing a gap up can bring a slash against a comment's own`, () => {
		expect(movesEndIntoInlineComment(`f(/ 1px /\n c)`, `f(//\n c)`, LESS)).toBe(false)
		expect(movesEndIntoInlineComment(`f(/ 1px / c)`, `f(// c)`, LESS)).toBe(true)
	})

	it(`a syntax spelling no comment with a double slash, where there is nothing for a character to move into`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c\n)`, `f(1px // c)`, PLAIN_CSS)).toBe(false)
	})
})
