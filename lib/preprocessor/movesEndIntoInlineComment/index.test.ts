import { describe, expect, it } from "vitest"

import { movesEndIntoInlineComment } from "./index.ts"

/** The reading Less has, which leaves such a comment standing in the value a rule reads. */
const LESS = { spells: true, keeps: true, answered: true }

/** The reading plain CSS has, which spells no comment with a double slash at all. */
const PLAIN_CSS = { spells: false, keeps: false, answered: true }

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

	it(`a bare carriage return or a form feed the fix takes away, which is whitespace and closes nothing, so that the character stands inside the comment on either side of the fix`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c\r)`, `f(1px // c)`, LESS)).toBe(false)
		expect(movesEndIntoInlineComment(`f(1px // c\f)`, `f(1px // c)`, LESS)).toBe(false)
	})

	it(`a fix weighed against the value it would leave rather than against the one that stands, since closing a gap up can bring a slash against a comment's own`, () => {
		expect(movesEndIntoInlineComment(`f(/ 1px /\n c)`, `f(//\n c)`, LESS)).toBe(false)
		expect(movesEndIntoInlineComment(`f(/ 1px / c)`, `f(// c)`, LESS)).toBe(true)
	})

	it(`a syntax spelling no comment with a double slash, where there is nothing for a character to move into`, () => {
		expect(movesEndIntoInlineComment(`f(1px // c\n)`, `f(1px // c)`, PLAIN_CSS)).toBe(false)
	})
})
