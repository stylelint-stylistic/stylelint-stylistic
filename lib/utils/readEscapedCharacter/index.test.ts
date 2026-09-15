import { describe, expect, it } from "vitest"

import { readEscapedCharacter } from "./index.ts"

describe(`readEscapedCharacter`, () => {
	it(`a solidus behind a backslash with a star behind it, which the backslash covers for the grammar and for no parser`, () => {
		expect(readEscapedCharacter(`a\\/*c*/`, 1)).toEqual({ character: undefined, end: 2 })
		expect(readEscapedCharacter(`\\/*`, 0)).toEqual({ character: undefined, end: 1 })
	})

	it(`the same solidus with anything but a star behind it, which the backslash covers`, () => {
		expect(readEscapedCharacter(`a\\/b`, 1)).toEqual({ character: `/`, end: 3 })
		expect(readEscapedCharacter(`a\\//b`, 1)).toEqual({ character: `/`, end: 3 })
		expect(readEscapedCharacter(`a\\/`, 1)).toEqual({ character: `/`, end: 3 })
	})

	// `postcss-scss` reads the comment and cuts it out of the value; Less and Sass read the escape, and `postcss-less` keeps it in the value. See #517
	it(`a double slash behind a backslash, which opens a comment under a syntax whose own tokenizer reads one`, () => {
		expect(readEscapedCharacter(`a\\//b`, 1, { spells: true, tokenizes: true })).toEqual({ character: undefined, end: 2 })
	})

	// See #517
	it(`the same double slash under a syntax whose tokenizer reads no such comment, and under one spelling none, where the backslash covers the solidus`, () => {
		expect(readEscapedCharacter(`a\\//b`, 1, { spells: true, tokenizes: false })).toEqual({ character: `/`, end: 3 })
		expect(readEscapedCharacter(`a\\//b`, 1, { spells: false, tokenizes: true })).toEqual({ character: `/`, end: 3 })
	})

	it(`a solidus an escape spells rather than writes, which the tokenizer covers with the digits`, () => {
		expect(readEscapedCharacter(`a\\2f/*c*/`, 1)).toEqual({ character: `/`, end: 4 })
	})

	it(`the delimiter behind an even run of backslashes, whose second backslash the first covers`, () => {
		expect(readEscapedCharacter(`a\\\\/*c*/`, 1)).toEqual({ character: `\\`, end: 3 })
	})

	it(`a backslash the text ends on and one standing in front of a line break, which spell nothing`, () => {
		expect(readEscapedCharacter(`a\\`, 1)).toEqual({ character: undefined, end: 2 })
		expect(readEscapedCharacter(`a\\\nb`, 1)).toEqual({ character: undefined, end: 2 })
	})

	it(`a character no solidus follows, which is the grammar's answer whole`, () => {
		expect(readEscapedCharacter(`a\\*b`, 1)).toEqual({ character: `*`, end: 3 })
		expect(readEscapedCharacter(`\\75 rl`, 0)).toEqual({ character: `u`, end: 4 })
		expect(readEscapedCharacter(`ab`, 0)).toEqual({ character: `a`, end: 1 })
	})
})
