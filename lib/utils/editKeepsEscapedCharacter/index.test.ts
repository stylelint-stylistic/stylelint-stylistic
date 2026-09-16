import { describe, expect, it } from "vitest"

import { editKeepsEscapedCharacter } from "./index.ts"

describe(`editKeepsEscapedCharacter`, () => {
	it(`a text ending on no backslash or on an even run of them`, () => {
		expect(editKeepsEscapedCharacter(`red !important`, { start: 3, end: 4, text: `` })).toBe(true)
		expect(editKeepsEscapedCharacter(`red \\\\ !important`, { start: 6, end: 7, text: `` })).toBe(true)
	})

	it(`a backslash whose space, tab or break the edit takes away or replaces`, () => {
		expect(editKeepsEscapedCharacter(`red \\ !important`, { start: 5, end: 6, text: `` })).toBe(false)
		expect(editKeepsEscapedCharacter(`red \\\\\\\t!important`, { start: 7, end: 8, text: `` })).toBe(false)
		expect(editKeepsEscapedCharacter(`red \\\n!important`, { start: 5, end: 6, text: ` ` })).toBe(false)
		expect(editKeepsEscapedCharacter(`red \\\r\n!important`, { start: 5, end: 7, text: ` ` })).toBe(false)
		expect(editKeepsEscapedCharacter(`red\\!important`, { start: 4, end: 4, text: ` ` })).toBe(false)
	})

	it(`a backslash whose character the edit keeps`, () => {
		expect(editKeepsEscapedCharacter(`red \\  !important`, { start: 5, end: 7, text: ` ` })).toBe(true)
		expect(editKeepsEscapedCharacter(`red \\/* c */!important`, { start: 12, end: 12, text: ` ` })).toBe(true)
	})
})
