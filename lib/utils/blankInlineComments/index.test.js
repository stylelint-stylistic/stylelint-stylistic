import { describe, expect, it } from "vitest"

import { blankInlineComments } from "./index.js"

/**
 * Spaces, spelled out so that no editor trims them off the end of a line.
 * @param {number} count - How many.
 * @returns {string} That many spaces.
 */
function spaces (count) {
	return ` `.repeat(count)
}

describe(`blankInlineComments`, () => {
	it(`no comment`, () => {
		expect(blankInlineComments(`1px 2px`)).toBe(`1px 2px`)
	})

	it(`a comment running to the end`, () => {
		expect(blankInlineComments(`1px // c`)).toBe(`1px ${spaces(4)}`)
	})

	it(`a comment ending with its line`, () => {
		expect(blankInlineComments(`1px // c\n2px`)).toBe(`1px ${spaces(4)}\n2px`)
	})

	it(`the value keeps its length`, () => {
		let value = `1px // a, b\n2px // c\n3px`

		expect(blankInlineComments(value)).toHaveLength(value.length)
	})

	it(`a quotation mark inside a comment opens no string`, () => {
		expect(blankInlineComments(`1px // it's\n'x'`)).toBe(`1px ${spaces(7)}\n'x'`)
	})

	it(`a double slash of an address is left alone`, () => {
		expect(blankInlineComments(`url(http://x/y.png)`)).toBe(`url(http://x/y.png)`)
	})

	it(`the spans may be handed in`, () => {
		expect(blankInlineComments(`1px // c\n2px`, [])).toBe(`1px // c\n2px`)
	})
})
