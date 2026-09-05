import { describe, expect, it } from "vitest"

import { readIdentifierCharacter } from "./index.ts"

describe(`readIdentifierCharacter`, () => {
	it(`a character no escape spells`, () => {
		expect(readIdentifierCharacter(`url(`, 0)).toEqual({ character: `u`, end: 1 })
	})

	it(`a character an escape spells with the character itself`, () => {
		expect(readIdentifierCharacter(`\\url(`, 0)).toEqual({ character: `u`, end: 2 })
		expect(readIdentifierCharacter(`\\)`, 0)).toEqual({ character: `)`, end: 2 })
	})

	it(`a character an escape spells in hexadecimal, whose closing whitespace belongs to it`, () => {
		expect(readIdentifierCharacter(`\\75 rl(`, 0)).toEqual({ character: `u`, end: 4 })
		expect(readIdentifierCharacter(`\\75rl(`, 0)).toEqual({ character: `u`, end: 3 })
		expect(readIdentifierCharacter(`\\000075 rl(`, 0)).toEqual({ character: `u`, end: 8 })
		expect(readIdentifierCharacter(`\\75\r\nrl(`, 0)).toEqual({ character: `u`, end: 5 })
	})

	it(`the second whitespace character behind such an escape, which is the text's own`, () => {
		expect(readIdentifierCharacter(`\\75  rl(`, 0)).toEqual({ character: `u`, end: 4 })
		expect(readIdentifierCharacter(`\\75  rl(`, 4)).toEqual({ character: ` `, end: 5 })
	})

	it(`a number no scalar answers to`, () => {
		expect(readIdentifierCharacter(`\\0 a`, 0)).toEqual({ character: `�`, end: 3 })
		expect(readIdentifierCharacter(`\\d800 a`, 0)).toEqual({ character: `�`, end: 6 })
		expect(readIdentifierCharacter(`\\110000 a`, 0)).toEqual({ character: `�`, end: 8 })
	})

	it(`the last code point, which a scalar does answer to`, () => {
		expect(readIdentifierCharacter(`\\10FFFF a`, 0)).toEqual({ character: `\u{10FFFF}`, end: 8 })
	})

	it(`a backslash spelling nothing, which no name is written with`, () => {
		expect(readIdentifierCharacter(`a\\`, 1)).toEqual({ character: undefined, end: 2 })
		expect(readIdentifierCharacter(`\\\nurl(`, 0)).toEqual({ character: undefined, end: 1 })
		expect(readIdentifierCharacter(`\\\r\nurl(`, 0)).toEqual({ character: undefined, end: 1 })
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/566
	it(`a backslash before a bare carriage return or a form feed, which the grammar reads a newline in as it reads one in a line feed, so that it spells nothing`, () => {
		expect(readIdentifierCharacter(`\\\rurl(`, 0)).toEqual({ character: undefined, end: 1 })
		expect(readIdentifierCharacter(`\\\furl(`, 0)).toEqual({ character: undefined, end: 1 })
	})
})
