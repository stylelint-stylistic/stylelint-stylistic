import { describe, expect, it } from "vitest"

import { closeInlineComments } from "./index.js"

describe(`closeInlineComments`, () => {
	it(`no comment`, () => {
		expect(closeInlineComments(`1px 2px`)).toBe(`1px 2px`)
	})

	it(`a comment already closed by a line feed`, () => {
		expect(closeInlineComments(`1px // c\n2px`)).toBe(`1px // c\n2px`)
	})

	it(`a comment closed by a carriage return`, () => {
		expect(closeInlineComments(`1px // c\r2px`)).toBe(`1px // c\n2px`)
	})

	it(`a comment closed by a form feed, where the syntax reads a line in one`, () => {
		expect(closeInlineComments(`1px // c\f2px`, [{ start: 4, end: 8 }])).toBe(`1px // c\n2px`)
	})

	it(`a comment running to the end of the text`, () => {
		expect(closeInlineComments(`1px // c`)).toBe(`1px // c`)
	})

	it(`the text keeps its length`, () => {
		let text = `1px // c\r2px // d\r3px`

		expect(closeInlineComments(text)).toHaveLength(text.length)
	})

	it(`two comments`, () => {
		expect(closeInlineComments(`1px // c\r2px // d\r3px`)).toBe(`1px // c\n2px // d\n3px`)
	})

	it(`a double slash of an address closes nothing`, () => {
		expect(closeInlineComments(`url(http://x/y.png)\r1px`)).toBe(`url(http://x/y.png)\r1px`)
	})

	it(`the spans may be handed in`, () => {
		expect(closeInlineComments(`1px // c\r2px`, [])).toBe(`1px // c\r2px`)
	})
})
