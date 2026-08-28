import { describe, expect, it } from "vitest"

import { findInlineCommentSpanAt, findInlineCommentSpans, findInlineCommentSpanTouching } from "./index.js"

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

describe(`findInlineCommentSpanTouching`, () => {
	let spans = [{ start: 4, end: 8 }]

	it(`a node ending where the comment opens, which carries none of its text`, () => {
		expect(findInlineCommentSpanTouching({ sourceIndex: 1, sourceEndIndex: 4 }, spans)).toBeUndefined()
	})

	it(`a node opening outside the comment and reaching into it`, () => {
		expect(findInlineCommentSpanTouching({ sourceIndex: 1, sourceEndIndex: 5 }, spans)).toEqual({ start: 4, end: 8 })
	})

	it(`a node opening outside the comment and reaching past the break that closes it`, () => {
		expect(findInlineCommentSpanTouching({ sourceIndex: 1, sourceEndIndex: 12 }, spans)).toEqual({ start: 4, end: 8 })
	})

	it(`a node standing inside the comment`, () => {
		expect(findInlineCommentSpanTouching({ sourceIndex: 5, sourceEndIndex: 7 }, spans)).toEqual({ start: 4, end: 8 })
	})

	it(`a node opening at the break that closes the comment`, () => {
		expect(findInlineCommentSpanTouching({ sourceIndex: 8, sourceEndIndex: 9 }, spans)).toBeUndefined()
	})

	it(`a node standing behind the comment`, () => {
		expect(findInlineCommentSpanTouching({ sourceIndex: 9, sourceEndIndex: 12 }, spans)).toBeUndefined()
	})

	it(`any node at all where the text holds no comment`, () => {
		expect(findInlineCommentSpanTouching({ sourceIndex: 4, sourceEndIndex: 8 }, [])).toBeUndefined()
	})
})
