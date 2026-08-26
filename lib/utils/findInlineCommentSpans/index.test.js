import { describe, expect, it } from "vitest"

import { findInlineCommentSpanAt, findInlineCommentSpans } from "./index.js"

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

	it(`a comment a carriage return closes`, () => {
		expect(findInlineCommentSpans(`1px // c\r2px`)).toEqual([{ start: 4, end: 8 }])
	})

	it(`a comment a form feed leaves open, since Less reads no line in one`, () => {
		expect(findInlineCommentSpans(`1px // c\f2px`)).toEqual([{ start: 4, end: 12 }])
	})

	it(`a comment a form feed closes where the syntax reads a line in one`, () => {
		expect(findInlineCommentSpans(`1px // c\f2px`, true)).toEqual([{ start: 4, end: 8 }])
	})

	it(`a syntax spelling no comment with a double slash has none to find`, () => {
		expect(findInlineCommentSpans(`1px // c\n2px`, false, false)).toEqual([])
		expect(findInlineCommentSpans(`myurl(//a) // c`, false, false)).toEqual([])
	})
})

describe(`findInlineCommentSpanAt`, () => {
	// The comment of `1px // c\n2px`, which runs from the double slash to the break
	let spans = [{ start: 4, end: 8 }]

	it(`a position in front of the comment`, () => {
		expect(findInlineCommentSpanAt(3, spans)).toBeUndefined()
	})

	it(`the position the comment opens at`, () => {
		expect(findInlineCommentSpanAt(4, spans)).toEqual({ start: 4, end: 8 })
	})

	it(`a position inside the text of the comment`, () => {
		expect(findInlineCommentSpanAt(6, spans)).toEqual({ start: 4, end: 8 })
	})

	it(`the last character the comment holds, which is the position in front of the break`, () => {
		expect(findInlineCommentSpanAt(7, spans)).toEqual({ start: 4, end: 8 })
	})

	it(`the position of the break that closes the comment, which the comment does not hold`, () => {
		expect(findInlineCommentSpanAt(8, spans)).toBeUndefined()
	})

	it(`a position behind the comment`, () => {
		expect(findInlineCommentSpanAt(9, spans)).toBeUndefined()
	})

	it(`any position at all where the text holds no comment`, () => {
		expect(findInlineCommentSpanAt(4, [])).toBeUndefined()
	})
})
