import { describe, expect, it } from "vitest"

import { selectorSearchCopy } from "./index.ts"

describe(`selectorSearchCopy`, () => {
	it(`no string`, () => {
		expect(selectorSearchCopy(`a,b`).searchString).toBe(`a,b`)
	})

	it(`a string ending in an escaped backslash, whose closing quotation mark the search reads as escaped`, () => {
		expect(selectorSearchCopy(`[a="b\\\\"],c`).searchString).toBe(`[a=?????],c`)
	})

	it(`a comma inside a string, which is no comma of the list`, () => {
		expect(selectorSearchCopy(`[a="x,y"],c`).searchString).toBe(`[a=?????],c`)
	})

	it(`a quotation mark inside a block comment, which opens no string and stays with the comment`, () => {
		expect(selectorSearchCopy(`a/*"*/,c`).searchString).toBe(`a/*"*/,c`)
		expect(selectorSearchCopy(`a/*'*/,[b="c\\\\"],d`).searchString).toBe(`a/*'*/,[b=?????],d`)
	})

	it(`a quotation mark inside a bare address, which opens no string`, () => {
		expect(selectorSearchCopy(`:is(url(x'y)),c`).searchString).toBe(`:is(url(x?y)),c`)
	})

	it(`a double slash, taken for code since no selector a rule is handed holds an inline comment`, () => {
		expect(selectorSearchCopy(`a//"b",c`).searchString).toBe(`a//???,c`)
	})

	// See 1789649818
	it(`an escaped comma, which is a character of the name, and an escaped backslash, behind which the comma is a comma`, () => {
		expect(selectorSearchCopy(`a\\,b,c`).searchString).toBe(`axxb,c`)
		expect(selectorSearchCopy(`a\\\\,b`).searchString).toBe(`axx,b`)
	})

	it(`an escape beside a string and a comment, each masked or kept as before`, () => {
		expect(selectorSearchCopy(`[a="b\\,c"]\\,d/*,*/,e`).searchString).toBe(`[a=??????]xxd/*,*/,e`)
	})

	// See 1789657288
	it(`the copy the runs are read over, which leaves the whitespace closing a hexadecimal escape as it is`, () => {
		expect(selectorSearchCopy(`a\\2c ,b\\ ,c`)).toEqual({ searchString: `axxxx,bxx,c`, runString: `axxx ,bxx,c`, escapes: [{ start: 1, end: 5 }, { start: 7, end: 9 }] })
	})

	// See 1789874864
	it(`the spans, which hold the whitespace closing a hexadecimal escape`, () => {
		expect(selectorSearchCopy(`a\\41\n\nb`).escapes).toEqual([{ start: 1, end: 5 }])
		expect(selectorSearchCopy(`a\\41\r\n\r\nb`).escapes).toEqual([{ start: 1, end: 6 }])
		expect(selectorSearchCopy(`a\\000041  b`).escapes).toEqual([{ start: 1, end: 9 }])
		expect(selectorSearchCopy(`a b`).escapes).toEqual([])
	})
})
