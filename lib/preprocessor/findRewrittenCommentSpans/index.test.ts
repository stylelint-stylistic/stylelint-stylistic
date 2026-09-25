import type { Declaration, Rule } from "postcss"
import { parse } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { findRewrittenCommentSpans } from "./index.ts"

/**
 * Reads the two copies `postcss-scss` keeps of a declaration's value.
 * @param value - The value as the file spells it.
 * @returns The copy with the comments rewritten and the copy as spelled.
 */
function copiesOf (value: string): [string, string] {
	let declaration = (parse(`a { b: ${value}; }`).first as Rule).first as Declaration
	let raws: { raw: string, scss?: string } | undefined = declaration.raws.value

	if (raws?.scss === undefined) throw new Error(`The value must hold an inline comment`)

	return [raws.raw, raws.scss]
}

describe(`findRewrittenCommentSpans`, () => {
	it(`an inline comment a line feed closes`, () => {
		expect(findRewrittenCommentSpans(...copiesOf(`1PX // c\n 2px`))).toEqual([{ start: 4, end: 8 }])
	})

	// The tokenizer ends the comment on a carriage return and a form feed as it does on a line feed, and the copies come back in step there
	it(`the same comment closed by a Windows pair, a bare carriage return and a form feed`, () => {
		expect(findRewrittenCommentSpans(...copiesOf(`1PX // c\r\n 2px`))).toEqual([{ start: 4, end: 8 }])
		expect(findRewrittenCommentSpans(...copiesOf(`1PX // c\r 2px`))).toEqual([{ start: 4, end: 8 }])
		expect(findRewrittenCommentSpans(...copiesOf(`1PX // c\f 2px`))).toEqual([{ start: 4, end: 8 }])
	})

	it(`two comments closed by Windows pairs, the second behind the first's pair`, () => {
		expect(findRewrittenCommentSpans(...copiesOf(`1PX // c\r\n 2px // d\r\n 3px`))).toEqual([{ start: 4, end: 8 }, { start: 15, end: 19 }])
	})

	// The parser moves a comment ending the value out of it, so the pair is written by hand to hold the walk's own branch
	it(`a comment running to the end of the value`, () => {
		expect(findRewrittenCommentSpans(`1PX /* c*/`, `1PX // c`)).toEqual([{ start: 4, end: 8 }])
	})

	it(`two copies that part ways other than at a rewritten comment`, () => {
		expect(findRewrittenCommentSpans(`1PX /* c*/\n 2px`, `1PX // c\n 3px`)).toBeNull()
	})
})
