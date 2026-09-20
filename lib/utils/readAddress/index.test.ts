import { describe, expect, it } from "vitest"

import { readAddress } from "./index.ts"

/** A syntax spelling `//` comments whose tokenizer reads none, which is `postcss-less`. */
const LESS = { spells: true, tokenizes: false, endsOnFormFeed: false }

/** `postcss-scss`, whose own tokenizer reads a `//` comment, so the parentheses are read as Sass reads them. */
const SCSS = { spells: true, tokenizes: true, endsOnFormFeed: true }

describe(`readAddress`, () => {
	it(`a bare address, which the first parenthesis behind it closes`, () => {
		expect(readAddress(`url(a.png) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 9, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(http://a/b.png)`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 18, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url()`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 4, comments: [], strings: [], escapes: [] })
	})

	it(`a parenthesis written inside a bare address, which closes it as the one behind it would`, () => {
		expect(readAddress(`url(a(b)c//d) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 7, comments: [], strings: [], escapes: [] })
	})

	it(`a parenthesis an escape holds, which closes nothing`, () => {
		expect(readAddress(`url(a\\)b) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 8, comments: [], strings: [], escapes: [{ start: 5, end: 7 }] })
		expect(readAddress(`url(a\\\\)b) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 7, comments: [], strings: [], escapes: [{ start: 5, end: 7 }] })
	})

	it(`a bare address the text closes with no parenthesis at all, which runs to its end`, () => {
		expect(readAddress(`url(a.png`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 9, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(a\\`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 6, comments: [], strings: [], escapes: [] })
	})

	it(`a quotation mark of either kind behind the parenthesis, which makes the address the string's and the rest of the parentheses code`, () => {
		expect(readAddress(`url("a" // c)`, 4, `url`, LESS)).toEqual({ isQuoted: true, index: 4, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url('a')`, 4, `url`, LESS)).toEqual({ isQuoted: true, index: 4, comments: [], strings: [], escapes: [] })
	})

	it(`whitespace between the parenthesis and the mark, which parts them for postcss-scss alone`, () => {
		expect(readAddress(`url( "a" // c)`, 4, `url`, LESS)).toEqual({ isQuoted: true, index: 5, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(\n\t"a.png"\n)`, 4, `url`, LESS)).toEqual({ isQuoted: true, index: 6, comments: [], strings: [], escapes: [] })
	})

	// None of the three is whitespace to any of the tokenizers; Sass reads the comment behind the no-break space and behind the line separator, and refuses a file holding the vertical tab at all, so the wider reading is the declining one. See #557
	it(`whitespace no tokenizer reads as whitespace between the parenthesis and the mark, which parts them all the same`, () => {
		expect(readAddress(`url(\u00A0"a" // c)`, 4, `url`, LESS)).toEqual({ isQuoted: true, index: 5, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(\v"a" // c)`, 4, `url`, LESS)).toEqual({ isQuoted: true, index: 5, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(\u2028"a" // c)`, 4, `url`, LESS)).toEqual({ isQuoted: true, index: 5, comments: [], strings: [], escapes: [] })
	})

	// The tokenizer takes one token of the parentheses wherever the `(` is met by anything but its own whitespace, so the delimiters are text of the address there and a comment behind whitespace is a comment. See #660
	it(`a block comment behind the whitespace of the tokenizer, which the parenthesis closing the parentheses then stands outside of`, () => {
		expect(readAddress(`url( a /* c */ ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 15, comments: [{ start: 7, end: 14, isInline: false }], strings: [], escapes: [] })
		expect(readAddress(`url( a /* ) */ ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 15, comments: [{ start: 7, end: 14, isInline: false }], strings: [], escapes: [] })
		expect(readAddress(`url(\na /* ) */ ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 15, comments: [{ start: 7, end: 14, isInline: false }], strings: [], escapes: [] })
	})

	// See #665
	it(`such a comment whose opening solidus a backslash stands in front of, which the backslash covers for the grammar and for no parser`, () => {
		expect(readAddress(`url( a\\/* ) */ ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 15, comments: [{ start: 7, end: 14, isInline: false }], strings: [], escapes: [] })
	})

	it(`the same address with the parenthesis standing against it, which the parsers take as one token`, () => {
		expect(readAddress(`url(a\\/* ) */ ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 9, comments: [], strings: [], escapes: [] })
	})

	it(`such a comment the text closes with no delimiter, which runs to that text's end and takes every parenthesis with it`, () => {
		expect(readAddress(`url( a /* c ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 17, comments: [{ start: 7, end: 17, isInline: false }], strings: [], escapes: [] })
	})

	it(`a block comment the parentheses open against, which is a character of the address`, () => {
		expect(readAddress(`url(a /* ) */ ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 9, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(a/*b) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 8, comments: [], strings: [], escapes: [] })
	})

	// The tokenizers read an address behind the word `url` alone, and a solidus makes the parentheses of any other call code. See #664
	it(`the same block comment behind a name spelled other than the word itself, which is a comment to every parser`, () => {
		expect(readAddress(`URL(a /* ) */ ) 1px`, 4, `URL`, LESS)).toEqual({ isQuoted: false, index: 14, comments: [{ start: 6, end: 13, isInline: false }], strings: [], escapes: [] })
		expect(readAddress(`\\75 rl(a/*b*/) 1px`, 7, `\\75 rl`, LESS)).toEqual({ isQuoted: false, index: 13, comments: [{ start: 8, end: 13, isInline: false }], strings: [], escapes: [] })
	})

	// The tokenizer glues a solidus or a comma to the name, so the word it reads in front of the parenthesis is no `url`
	it(`the same block comment behind a name a solidus or a comma is glued to, which is a comment to the tokenizer, and the address Sass reads there under its parser`, () => {
		expect(readAddress(`x /url(a/* ) */) 1px`, 7, `url`, LESS)).toEqual({ isQuoted: false, index: 15, comments: [{ start: 8, end: 15, isInline: false }], strings: [], escapes: [] })
		expect(readAddress(`1,url(a/* ) */) 1px`, 6, `url`, { spells: false, tokenizes: false, endsOnFormFeed: false })).toEqual({ isQuoted: false, index: 14, comments: [{ start: 7, end: 14, isInline: false }], strings: [], escapes: [] })
		expect(readAddress(`x /url(a/*b) // c */) 1px`, 7, `url`, SCSS)).toEqual({ isQuoted: false, index: 11, comments: [], strings: [], escapes: [] })
	})

	// Sass reads an address there and a double slash behind it, which the parser's comment would hide. See #664
	it(`the same name under the parser Sass is read by, where Sass reads an address and the parser a comment`, () => {
		expect(readAddress(`URL(a/*b) // c */) 1px`, 4, `URL`, SCSS)).toEqual({ isQuoted: false, index: 8, comments: [], strings: [], escapes: [] })
	})

	// Sass reads the parentheses as code wherever they hold no unquoted address, and a comment inside them is a comment to it. See #661
	it(`comments of both kinds inside parentheses Sass reads as code, under the parser whose tokenizer reads a double slash`, () => {
		expect(readAddress(`url(a /* ) */ ) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 14, comments: [{ start: 6, end: 13, isInline: false }], strings: [], escapes: [] })
		expect(readAddress(`url(a // ) c\n) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 13, comments: [{ start: 6, end: 12, isInline: true }], strings: [], escapes: [] })
		expect(readAddress(`url($a /* ) */) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 14, comments: [{ start: 7, end: 14, isInline: false }], strings: [], escapes: [] })
	})

	it(`the same parentheses where the syntax spells no double slash, which leaves that one a character of them`, () => {
		expect(readAddress(`url(a // ) c\n) 1px`, 4, `url`, { spells: false, tokenizes: true, endsOnFormFeed: false })).toEqual({ isQuoted: false, index: 9, comments: [], strings: [], escapes: [] })
	})

	it(`parentheses Sass reads as an unquoted address, whose delimiters stay characters of it under that parser too`, () => {
		expect(readAddress(`url(a//b) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 8, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(a/*b*/) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 10, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(#{$a}//b\\)c) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 15, comments: [], strings: [], escapes: [{ start: 12, end: 14 }] })
	})

	it(`an interpolation holding a closing brace in a string or a comment, which Sass reads to the brace closing the expression`, () => {
		expect(readAddress(`url(#{"}"}a/*) 1px // c */`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 13, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(#{a /* } */}/*) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 18, comments: [], strings: [], escapes: [] })
	})

	it(`an interpolation holding a call, whose closing parenthesis Sass reads as the expression's and not as the one closing the parentheses`, () => {
		expect(readAddress(`url(#{f(a)}//c) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 14, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url($a #{f(b)} // c\n) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 20, comments: [{ start: 15, end: 19, isInline: true }], strings: [], escapes: [] })
	})

	it(`a comment inside an interpolation in parentheses Sass reads as code, which is recorded as one standing outside it would be`, () => {
		expect(readAddress(`url($a #{c // )\n}) , 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 17, comments: [{ start: 11, end: 15, isInline: true }], strings: [], escapes: [] })
	})

	// The expression is Sass code, so a backslash there covers what stands behind it: Sass reads `url(a#{b\\}c}d)` as the address `ab\\}cd` (1789883888)
	it(`an escape standing in the code of an interpolation, which is recorded and whose brace closes the expression no more than its parenthesis closes the parentheses`, () => {
		expect(readAddress(`url(a#{b\\\t  c}d)`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 15, comments: [], strings: [], escapes: [{ start: 8, end: 10 }] })
		expect(readAddress(`url(a#{b\\}c}d)`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 13, comments: [], strings: [], escapes: [{ start: 8, end: 10 }] })
	})

	it(`an escape inside a string or a comment of that expression, which is none of the address's`, () => {
		expect(readAddress(`url(a#{"b\\,c"}d)`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 15, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url($a #{b /*\\,*/ c}d) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 21, comments: [{ start: 11, end: 17, isInline: false }], strings: [], escapes: [] })
	})

	it(`an interpolation the text never closes, whose parenthesis closes the address as it would without the opening`, () => {
		expect(readAddress(`url(a#{) // d`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 7, comments: [], strings: [], escapes: [] })
	})

	it(`a hexadecimal escape closed by a Windows pair, whose line feed Sass reads as whitespace of the parentheses`, () => {
		expect(readAddress(`url(\\41\r\n/* ) */ ) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 17, comments: [{ start: 9, end: 16, isInline: false }], strings: [], escapes: [{ start: 4, end: 9 }] })
	})

	it(`a text cut short inside such parentheses, which is an address where nothing in front of the cut makes it code`, () => {
		expect(readAddress(`url(http://a/b`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 14, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(a // c`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 10, comments: [{ start: 6, end: 10, isInline: true }], strings: [], escapes: [] })
	})

	// A no-break space is no whitespace to the tokenizer, so the parentheses are one token to it and the comment is text. See #660
	it(`a block comment behind whitespace the tokenizer reads as a character of the address`, () => {
		expect(readAddress(`url(\u00A0a /* ) */ ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 10, comments: [], strings: [], escapes: [] })
	})

	it(`a double slash behind that whitespace, which no compiler reads as a comment inside an address`, () => {
		expect(readAddress(`url( a//b ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 10, comments: [], strings: [], escapes: [] })
	})

	it(`a quotation mark standing deeper inside a bare address, which opens no string`, () => {
		expect(readAddress(`url(a"b.png)`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 11, comments: [], strings: [], escapes: [] })
	})

	// The parentheses are code wherever comments are read inside them, so a quotation mark opens a string, and the comment delimiters and the parenthesis it holds are its text
	it(`a string inside parentheses whose comments are read, which hides the delimiters and the parenthesis it holds`, () => {
		expect(readAddress(`url( a "/*" b/c) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 15, comments: [], strings: [{ start: 7, end: 11 }], escapes: [] })
		expect(readAddress(`url( a "/*)" /* c */ ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 21, comments: [{ start: 13, end: 20, isInline: false }], strings: [{ start: 7, end: 12 }], escapes: [] })
		expect(readAddress(`url(a "/*" b/c) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 14, comments: [], strings: [{ start: 6, end: 10 }], escapes: [] })
		expect(readAddress(`url(a '//' // c\n) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 16, comments: [{ start: 11, end: 15, isInline: true }], strings: [{ start: 6, end: 10 }], escapes: [] })
	})

	// The string is handed back with the comments, so that the walk records it and a comma inside it is text to a scan over the copy (1789637913)
	it(`the same string handed back, quotation marks and all, under every reading of the parentheses as code`, () => {
		expect(readAddress(`1px, 1/url(a "),b" ), 2px`, 11, `url`, LESS)).toEqual({ isQuoted: false, index: 19, comments: [], strings: [{ start: 13, end: 18 }], escapes: [] })
		expect(readAddress(`1,url(a ') , b' ) 2px`, 6, `url`, LESS)).toEqual({ isQuoted: false, index: 16, comments: [], strings: [{ start: 8, end: 15 }], escapes: [] })
		expect(readAddress(`url( a "/*)" /* c */ "d" ) 1px`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 25, comments: [{ start: 13, end: 20, isInline: false }], strings: [{ start: 7, end: 12 }, { start: 21, end: 24 }], escapes: [] })
		expect(readAddress(`URL(a "),b" ) 1px`, 4, `URL`, LESS)).toEqual({ isQuoted: false, index: 12, comments: [], strings: [{ start: 6, end: 11 }], escapes: [] })
		expect(readAddress(`url(a "),b" ) 1px`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 12, comments: [], strings: [{ start: 6, end: 11 }], escapes: [] })
	})

	// No compiler takes such a file, and a comment behind the call stays readable to the guards
	it(`a quotation mark the text closes with no other, which stays a character of the address`, () => {
		expect(readAddress(`url( a"b.png )`, 4, `url`, LESS)).toEqual({ isQuoted: false, index: 13, comments: [], strings: [], escapes: [] })
		expect(readAddress(`url(a'b) 1px // c`, 4, `url`, SCSS)).toEqual({ isQuoted: false, index: 7, comments: [], strings: [], escapes: [] })
	})
})
