import { describe, expect, it } from "vitest"

import { readAddress } from "./index.ts"

describe(`readAddress`, () => {
	it(`a bare address, which the first parenthesis behind it closes`, () => {
		expect(readAddress(`url(a.png) 1px`, 4)).toEqual({ isQuoted: false, index: 9, comments: [] })
		expect(readAddress(`url(http://a/b.png)`, 4)).toEqual({ isQuoted: false, index: 18, comments: [] })
		expect(readAddress(`url()`, 4)).toEqual({ isQuoted: false, index: 4, comments: [] })
	})

	it(`a parenthesis written inside a bare address, which closes it as the one behind it would`, () => {
		expect(readAddress(`url(a(b)c//d) 1px`, 4)).toEqual({ isQuoted: false, index: 7, comments: [] })
	})

	it(`a parenthesis an escape holds, which closes nothing`, () => {
		expect(readAddress(`url(a\\)b) 1px`, 4)).toEqual({ isQuoted: false, index: 8, comments: [] })
		expect(readAddress(`url(a\\\\)b) 1px`, 4)).toEqual({ isQuoted: false, index: 7, comments: [] })
	})

	it(`a bare address the text closes with no parenthesis at all, which runs to its end`, () => {
		expect(readAddress(`url(a.png`, 4)).toEqual({ isQuoted: false, index: 9, comments: [] })
		expect(readAddress(`url(a\\`, 4)).toEqual({ isQuoted: false, index: 6, comments: [] })
	})

	it(`a quotation mark of either kind behind the parenthesis, which makes the address the string's and the rest of the parentheses code`, () => {
		expect(readAddress(`url("a" // c)`, 4)).toEqual({ isQuoted: true, index: 4, comments: [] })
		expect(readAddress(`url('a')`, 4)).toEqual({ isQuoted: true, index: 4, comments: [] })
	})

	it(`whitespace between the parenthesis and the mark, which parts them for postcss-scss alone`, () => {
		expect(readAddress(`url( "a" // c)`, 4)).toEqual({ isQuoted: true, index: 5, comments: [] })
		expect(readAddress(`url(\n\t"a.png"\n)`, 4)).toEqual({ isQuoted: true, index: 6, comments: [] })
	})

	// None of the three is whitespace to any of the tokenizers; Sass reads the comment behind the no-break space and behind the line separator, and refuses a file holding the vertical tab at all, so the wider reading is the declining one. See #557
	it(`whitespace no tokenizer reads as whitespace between the parenthesis and the mark, which parts them all the same`, () => {
		expect(readAddress(`url(\u00A0"a" // c)`, 4)).toEqual({ isQuoted: true, index: 5, comments: [] })
		expect(readAddress(`url(\v"a" // c)`, 4)).toEqual({ isQuoted: true, index: 5, comments: [] })
		expect(readAddress(`url(\u2028"a" // c)`, 4)).toEqual({ isQuoted: true, index: 5, comments: [] })
	})

	// The tokenizer takes one token of the parentheses wherever the `(` is met by anything but its own whitespace, so the delimiters are text of the address there and a comment behind whitespace is a comment. See #660
	it(`a block comment behind the whitespace of the tokenizer, which the parenthesis closing the parentheses then stands outside of`, () => {
		expect(readAddress(`url( a /* c */ ) 1px`, 4)).toEqual({ isQuoted: false, index: 15, comments: [{ start: 7, end: 14, isInline: false }] })
		expect(readAddress(`url( a /* ) */ ) 1px`, 4)).toEqual({ isQuoted: false, index: 15, comments: [{ start: 7, end: 14, isInline: false }] })
		expect(readAddress(`url(\na /* ) */ ) 1px`, 4)).toEqual({ isQuoted: false, index: 15, comments: [{ start: 7, end: 14, isInline: false }] })
	})

	// See #665
	it(`such a comment whose opening solidus a backslash stands in front of, which the backslash covers for the grammar and for no parser`, () => {
		expect(readAddress(`url( a\\/* ) */ ) 1px`, 4)).toEqual({ isQuoted: false, index: 15, comments: [{ start: 7, end: 14, isInline: false }] })
	})

	it(`the same address with the parenthesis standing against it, which the parsers take as one token`, () => {
		expect(readAddress(`url(a\\/* ) */ ) 1px`, 4)).toEqual({ isQuoted: false, index: 9, comments: [] })
	})

	it(`such a comment the text closes with no delimiter, which runs to that text's end and takes every parenthesis with it`, () => {
		expect(readAddress(`url( a /* c ) 1px`, 4)).toEqual({ isQuoted: false, index: 17, comments: [{ start: 7, end: 17, isInline: false }] })
	})

	it(`a block comment the parentheses open against, which is a character of the address`, () => {
		expect(readAddress(`url(a /* ) */ ) 1px`, 4)).toEqual({ isQuoted: false, index: 9, comments: [] })
		expect(readAddress(`url(a/*b) 1px`, 4)).toEqual({ isQuoted: false, index: 8, comments: [] })
	})

	// A no-break space is no whitespace to the tokenizer, so the parentheses are one token to it and the comment is text. See #660
	it(`a block comment behind whitespace the tokenizer reads as a character of the address`, () => {
		expect(readAddress(`url(\u00A0a /* ) */ ) 1px`, 4)).toEqual({ isQuoted: false, index: 10, comments: [] })
	})

	it(`a double slash behind that whitespace, which no compiler reads as a comment inside an address`, () => {
		expect(readAddress(`url( a//b ) 1px`, 4)).toEqual({ isQuoted: false, index: 10, comments: [] })
	})

	it(`a quotation mark standing deeper inside a bare address, which opens no string`, () => {
		expect(readAddress(`url(a"b.png)`, 4)).toEqual({ isQuoted: false, index: 11, comments: [] })
		expect(readAddress(`url( a"b.png )`, 4)).toEqual({ isQuoted: false, index: 13, comments: [] })
	})
})
