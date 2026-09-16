import { describe, expect, it } from "vitest"

import { selectorSearchCopy } from "./index.ts"

describe(`selectorSearchCopy`, () => {
	it(`no string`, () => {
		expect(selectorSearchCopy(`a,b`)).toBe(`a,b`)
	})

	it(`a string ending in an escaped backslash, whose closing quotation mark the search reads as escaped`, () => {
		expect(selectorSearchCopy(`[a="b\\\\"],c`)).toBe(`[a=?????],c`)
	})

	it(`a comma inside a string, which is no comma of the list`, () => {
		expect(selectorSearchCopy(`[a="x,y"],c`)).toBe(`[a=?????],c`)
	})

	it(`a quotation mark inside a block comment, which opens no string and stays with the comment`, () => {
		expect(selectorSearchCopy(`a/*"*/,c`)).toBe(`a/*"*/,c`)
		expect(selectorSearchCopy(`a/*'*/,[b="c\\\\"],d`)).toBe(`a/*'*/,[b=?????],d`)
	})

	it(`a quotation mark inside a bare address, which opens no string`, () => {
		expect(selectorSearchCopy(`:is(url(x'y)),c`)).toBe(`:is(url(x?y)),c`)
	})

	it(`a double slash, taken for code since no selector a rule is handed holds an inline comment`, () => {
		expect(selectorSearchCopy(`a//"b",c`)).toBe(`a//???,c`)
	})
})
