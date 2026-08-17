import { describe, expect, it } from "vitest"

import { findInlineCommentSpans } from "./index.js"

describe(`findInlineCommentSpans`, () => {
	it(`no comment`, () => {
		expect(findInlineCommentSpans(`1px 2px`)).toEqual([])
	})

	it(`a comment running to the end`, () => {
		expect(findInlineCommentSpans(`1px // c`)).toEqual([{ start: 4, end: 8 }])
	})

	it(`a comment ending with its line`, () => {
		expect(findInlineCommentSpans(`1px // c\n2px`)).toEqual([{ start: 4, end: 8 }])
	})

	it(`two comments`, () => {
		expect(findInlineCommentSpans(`1px // c\n2px // d\n3px`)).toEqual([{ start: 4, end: 8 }, { start: 13, end: 17 }])
	})

	it(`a double slash inside a string`, () => {
		expect(findInlineCommentSpans(`"//" 1px`)).toEqual([])
	})

	it(`a double slash inside an escaped string`, () => {
		expect(findInlineCommentSpans(`"a\\" // b" 1px`)).toEqual([])
	})

	it(`a double slash inside a bare address`, () => {
		expect(findInlineCommentSpans(`url(http://x/y.png)`)).toEqual([])
	})

	it(`a double slash inside a quoted address`, () => {
		expect(findInlineCommentSpans(`url("http://x/y.png")`)).toEqual([])
	})

	it(`a comment behind an address`, () => {
		expect(findInlineCommentSpans(`url(http://x/y.png) // c`)).toEqual([{ start: 20, end: 24 }])
	})

	it(`a call whose name ends in the letters of an address token`, () => {
		expect(findInlineCommentSpans(`image-url(a) // c`)).toEqual([{ start: 13, end: 17 }])
	})

	it(`a double slash inside a block comment`, () => {
		expect(findInlineCommentSpans(`/* // */ 1px`)).toEqual([])
	})

	it(`a block comment inside an inline one`, () => {
		expect(findInlineCommentSpans(`// /* c\n1px`)).toEqual([{ start: 0, end: 7 }])
	})
})
