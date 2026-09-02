import { describe, expect, it } from "vitest"

import { findInlineCommentSpans } from "./index.ts"

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

	it(`a comment a Windows pair closes, the carriage return of the pair staying outside the span with the line feed`, () => {
		expect(findInlineCommentSpans(`1px // c\r\n2px`)).toEqual([{ start: 4, end: 8 }])
	})

	it(`a bare carriage return or a form feed inside the comment, which is whitespace and closes nothing`, () => {
		expect(findInlineCommentSpans(`1px // c\r2px`)).toEqual([{ start: 4, end: 12 }])
		expect(findInlineCommentSpans(`1px // c\f2px`)).toEqual([{ start: 4, end: 12 }])
	})

	it(`a syntax spelling no comment with a double slash has none to find`, () => {
		expect(findInlineCommentSpans(`1px // c\n2px`, false)).toEqual([])
		expect(findInlineCommentSpans(`myurl(//a) // c`, false)).toEqual([])
	})
})
