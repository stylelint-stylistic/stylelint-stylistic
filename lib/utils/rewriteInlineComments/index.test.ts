import { describe, expect, it } from "vitest"

import { rewriteInlineComments } from "./index.ts"

describe(`rewriteInlineComments`, () => {
	it(`no comment`, () => {
		expect(rewriteInlineComments(`1px 2px`)).toBe(`1px 2px`)
	})

	it(`a comment running to the end`, () => {
		expect(rewriteInlineComments(`1px // c`)).toBe(`1px /* c*/`)
	})

	it(`a comment ending with its line`, () => {
		expect(rewriteInlineComments(`1px // c\n2px`)).toBe(`1px /* c*/\n2px`)
	})

	it(`two comments`, () => {
		expect(rewriteInlineComments(`1px // c\n2px // d\n3px`)).toBe(`1px /* c*/\n2px /* d*/\n3px`)
	})

	it(`a comment whose text would close the block comment early`, () => {
		expect(rewriteInlineComments(`1px // a */ b\n2px`)).toBe(`1px /* a *//* b*/\n2px`)
	})

	it(`a comment whose text would open a block comment of its own`, () => {
		expect(rewriteInlineComments(`1px // a /* b\n2px`)).toBe(`1px /* a *//* b*/\n2px`)
	})

	it(`a block comment is left as it stands`, () => {
		expect(rewriteInlineComments(`1px /* c */ 2px`)).toBe(`1px /* c */ 2px`)
	})

	it(`a double slash of an address opens nothing`, () => {
		expect(rewriteInlineComments(`url(http://x/y.png)`)).toBe(`url(http://x/y.png)`)
	})

	it(`the spans may be handed in`, () => {
		expect(rewriteInlineComments(`1px // c\n2px`, [])).toBe(`1px // c\n2px`)
	})
})
