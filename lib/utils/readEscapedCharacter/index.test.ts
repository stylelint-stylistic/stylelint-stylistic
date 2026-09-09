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
