import { describe, expect, it } from "vitest"

import { blankComments } from "./index.js"

describe(`blankComments`, () => {
	it(`no comment`, () => {
		expect(blankComments(`1px 2px`)).toBe(`1px 2px`)
	})

	it(`a block comment goes with its delimiters`, () => {
		expect(blankComments(`1px /*c*/ 2px`)).toBe(`1px       2px`)
	})

	it(`a block comment closing where the next one opens`, () => {
		expect(blankComments(`1px/*x*//*y*/,2px`)).toBe(`1px          ,2px`)
	})

	it(`an inline comment, whose break stays where it is`, () => {
		expect(blankComments(`1px // c\n2px`)).toBe(`1px     \n2px`)
	})

	it(`a comment broken over lines`, () => {
		expect(blankComments(`1px /*a\nb*/ 2px`)).toBe(`1px         2px`)
	})

	it(`a double slash belonging to an address`, () => {
		expect(blankComments(`url(http://x) 1px`)).toBe(`url(http://x) 1px`)
	})

	it(`a run inside a string that spells the delimiters of a comment`, () => {
		expect(blankComments(`"a/*b" "c*/d"`)).toBe(`"a/*b" "c*/d"`)
	})

	it(`the copy is as long as the text`, () => {
		let text = `1px /*a*/ , // b\n2px`

		expect(blankComments(text)).toHaveLength(text.length)
	})

	it(`spans handed in rather than found`, () => {
		expect(blankComments(`1px /*c*/ 2px`, [{ start: 4, end: 9, isInline: false }])).toBe(`1px       2px`)
	})
})
