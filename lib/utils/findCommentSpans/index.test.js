import { describe, expect, it } from "vitest"

import { findCommentSpans } from "./index.js"

describe(`findCommentSpans`, () => {
	it(`no comment`, () => {
		expect(findCommentSpans(`1px 2px`)).toEqual([])
	})

	it(`a block comment, delimiters and all`, () => {
		expect(findCommentSpans(`1px /*c*/ 2px`)).toEqual([{ start: 4, end: 9, isInline: false }])
	})

	it(`a block comment the text never closes`, () => {
		expect(findCommentSpans(`1px /*c`)).toEqual([{ start: 4, end: 7, isInline: false }])
	})

	it(`a block comment broken over lines`, () => {
		expect(findCommentSpans(`1px /*a\nb*/ 2px`)).toEqual([{ start: 4, end: 11, isInline: false }])
	})

	it(`an inline comment, whose break stays outside the span`, () => {
		expect(findCommentSpans(`1px // c\n2px`)).toEqual([{ start: 4, end: 8, isInline: true }])
	})

	it(`a comment of each kind`, () => {
		expect(findCommentSpans(`/*a*/ 1px // b`)).toEqual([{ start: 0, end: 5, isInline: false }, { start: 10, end: 14, isInline: true }])
	})

	it(`a block comment closing where the next one opens`, () => {
		expect(findCommentSpans(`/*a*//*b*/`)).toEqual([{ start: 0, end: 5, isInline: false }, { start: 5, end: 10, isInline: false }])
	})

	it(`a double slash inside a block comment opens nothing`, () => {
		expect(findCommentSpans(`/* // */ 1px`)).toEqual([{ start: 0, end: 8, isInline: false }])
	})

	it(`a run inside a string that spells the delimiters of a comment`, () => {
		expect(findCommentSpans(`"a/*b" "c*/d"`)).toEqual([])
	})

	it(`a double slash belonging to a bare address`, () => {
		expect(findCommentSpans(`url(http://x/y.png)`)).toEqual([])
	})

	it(`a comment behind an address`, () => {
		expect(findCommentSpans(`url(http://x) // c`)).toEqual([{ start: 14, end: 18, isInline: true }])
	})

	it(`a comment a carriage return closes`, () => {
		expect(findCommentSpans(`1px // c\r2px`)).toEqual([{ start: 4, end: 8, isInline: true }])
	})

	it(`a comment a form feed closes, where the syntax reads a line in one`, () => {
		expect(findCommentSpans(`1px // c\f2px`, true)).toEqual([{ start: 4, end: 8, isInline: true }])
	})

	it(`a form feed closes no comment where nothing is said`, () => {
		expect(findCommentSpans(`1px // c\f2px`)).toEqual([{ start: 4, end: 12, isInline: true }])
	})
})
