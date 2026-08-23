import { describe, expect, it } from "vitest"

import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"

import { hideFalseInlineComments } from "./index.js"

describe(`hideFalseInlineComments`, () => {
	it(`no double slash`, () => {
		expect(hideFalseInlineComments(`1px 2px`)).toBe(`1px 2px`)
	})

	it(`a comment leaves as it stands`, () => {
		expect(hideFalseInlineComments(`1px // c`)).toBe(`1px // c`)
	})

	it(`a bare address`, () => {
		expect(hideFalseInlineComments(`url(http://x/y.png)`)).toBe(`url(http:/?x/y.png)`)
	})

	it(`a quoted address`, () => {
		expect(hideFalseInlineComments(`url("http://x/y.png")`)).toBe(`url("http:/?x/y.png")`)
	})

	it(`an address in a value of its own`, () => {
		expect(hideFalseInlineComments(`"//x"`)).toBe(`"/?x"`)
	})

	it(`two addresses`, () => {
		expect(hideFalseInlineComments(`url(//a) 1x, url(//b) 2x`)).toBe(`url(/?a) 1x, url(/?b) 2x`)
	})

	it(`a double slash inside a block comment`, () => {
		expect(hideFalseInlineComments(`/* // */ 1px`)).toBe(`/* /? */ 1px`)
	})

	it(`an address in front of a comment`, () => {
		expect(hideFalseInlineComments(`url(http://x) // c`)).toBe(`url(http:/?x) // c`)
	})

	it(`a double slash inside an address whose second slash opens no comment of its own`, () => {
		expect(hideFalseInlineComments(`url(a//*b*/)`)).toBe(`url(a/?*b*/)`)
	})

	it(`a block comment closing where the next one opens`, () => {
		expect(hideFalseInlineComments(`a/*x*//*y*/b`)).toBe(`a/*x*//*y*/b`)
	})

	it(`a slash behind a block comment`, () => {
		expect(hideFalseInlineComments(`a/*x*//b`)).toBe(`a/*x*/?b`)
	})

	it(`a comment opening behind a block comment`, () => {
		expect(hideFalseInlineComments(`a/*x*///y`)).toBe(`a/*x*///y`)
	})

	it(`a third slash behind a comment opening`, () => {
		expect(hideFalseInlineComments(`1px /// c`)).toBe(`1px //? c`)
	})

	it(`a double slash inside the text of a comment`, () => {
		expect(hideFalseInlineComments(`1px // a//b`)).toBe(`1px // a/?b`)
	})

	it(`an address behind a comment a carriage return closes`, () => {
		expect(hideFalseInlineComments(`url(http://x) // c\rurl(http://y)`)).toBe(`url(http:/?x) // c\rurl(http:/?y)`)
	})

	it(`an address behind a comment a form feed closes`, () => {
		expect(hideFalseInlineComments(`url(http://x) // c\furl(http://y)`, findInlineCommentSpans(`url(http://x) // c\furl(http://y)`, true))).toBe(`url(http:/?x) // c\furl(http:/?y)`)
	})

	it(`a data URI`, () => {
		expect(hideFalseInlineComments(`url(data:image/svg+xml;base64,ab//cd)`)).toBe(`url(data:image/svg+xml;base64,ab/?cd)`)
	})

	it(`an address inside a token whose name is written in another case`, () => {
		expect(hideFalseInlineComments(`URL(http://x/y.png)`)).toBe(`URL(http:/?x/y.png)`)
	})

	it(`an address an interpolation opens`, () => {
		expect(hideFalseInlineComments(`url(#{$a}//b)`)).toBe(`url(#{$a}/?b)`)
	})

	it(`an address holding an escaped parenthesis`, () => {
		expect(hideFalseInlineComments(`url(http://x\\)y)`)).toBe(`url(http:/?x\\)y)`)
	})

	it(`spans handed in rather than found`, () => {
		expect(hideFalseInlineComments(`url(//a) // c`, [{ start: 9, end: 13 }])).toBe(`url(/?a) // c`)
	})
})
