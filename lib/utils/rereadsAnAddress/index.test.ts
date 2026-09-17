import { describe, expect, it } from "vitest"

import { rereadsAnAddress } from "./index.ts"

let POSTCSS = { tokenizes: false }
let SCSS = { tokenizes: true }

describe(`rereadsAnAddress`, () => {
	it(`a space parting the name from a comma, in front of a string holding the closing parenthesis`, () => {
		expect(rereadsAnAddress(`1,url(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
	})

	it(`a run taken away, which joins the name to the comma in front of a quotation mark nothing closes`, () => {
		expect(rereadsAnAddress(`1, url(a"b)`, { start: 2, end: 3, text: `` }, POSTCSS)).toBe(true)
	})

	it(`a break parting the name from a solidus, in front of an opening parenthesis or square bracket`, () => {
		expect(rereadsAnAddress(`1/url(a(b)`, { start: 2, end: 2, text: `\n` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url(a[b)`, { start: 2, end: 2, text: `\n` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`@media (a,url(a(b))`, { start: 10, end: 10, text: ` ` }, POSTCSS)).toBe(true)
	})

	it(`parentheses no parenthesis closes, and a comment nothing closes or one covering the parenthesis that closes the token`, () => {
		expect(rereadsAnAddress(`1,url(a/*)"*/b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url(a/*)*/b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url(a`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url(a/*b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
	})

	it(`a parenthesis escaped by a backslash, which closes nothing, in front of a quotation mark`, () => {
		expect(rereadsAnAddress(`1,url(a\\)"b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url(a\\\\)"b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
	})

	it(`an address both readings close at the same parenthesis`, () => {
		expect(rereadsAnAddress(`1,url(a/b.png)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url(a "/*" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
	})

	it(`a quotation mark or whitespace behind the opening parenthesis, which leaves the parentheses code under both words`, () => {
		expect(rereadsAnAddress(`1,url("a)")`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url( ")" )`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
	})

	it(`a vertical tab behind the opening parenthesis, which is a word to the tokenizer`, () => {
		expect(rereadsAnAddress(`1,url(")")`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
	})

	it(`an edit leaving the name where it was read`, () => {
		expect(rereadsAnAddress(`1, url(a"b)`, { start: 2, end: 3, text: `\n` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,/* c */url(a"b)`, { start: 9, end: 9, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`(url(a"b)`, { start: 1, end: 1, text: ` ` }, POSTCSS)).toBe(false)
	})

	it(`whitespace or a comment between the name and the opening parenthesis, which leave the name the last word read`, () => {
		expect(rereadsAnAddress(`1,url (a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1, url/**/(a"b)`, { start: 2, end: 3, text: `` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url a(b"c)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
	})

	it(`a string, an at-word, an escape or a character read as a token of its own between the name and the opening parenthesis, which push no word either, and a word, which takes the name's place`, () => {
		expect(rereadsAnAddress(`1,url"x"(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url'x'(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url"#{"}"}"(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url@x,(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url\\,(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url\\\\(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url\\6a (a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url\\ (a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url[](a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url)(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`f(1,url)(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`f(1,url)(a ")" b)`, { start: 4, end: 4, text: `\n` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`f(1,\nurl)(a"b)`, { start: 4, end: 5, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`f(1,url"x")(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`\\(1,url)(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`(a) 1,url)(a ")" b)`, { start: 6, end: 6, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url"x"@y/*c*/\\,(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1, url"x"(a"b)`, { start: 2, end: 3, text: `` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url\\(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url\\/(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url\\\u{1F600}(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url[x](a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url!(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url#(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url,(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url#{a}(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,url // c\n(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
	})

	it(`a comma, an interpolation or a comment to the end of the line between the name and the opening parenthesis, which push no word under a parser whose own tokenizer reads them`, () => {
		expect(rereadsAnAddress(`1/url,(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url,,(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url#{a}(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url#{"("}(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url // c\n(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url"#{"}"}"(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url@x(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url // c(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(false)
		expect(rereadsAnAddress(`1/url#(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(false)
	})

	it(`an escaped character in front of the name, which is a word of its own`, () => {
		expect(rereadsAnAddress(`a\\, url(a"b)`, { start: 3, end: 4, text: `` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`a\\\\, url(a"b)`, { start: 4, end: 5, text: `` }, POSTCSS)).toBe(true)
	})

	it(`a comma under a parser whose own tokenizer ends a word on it, except inside an at-word`, () => {
		expect(rereadsAnAddress(`@a,url(a ")" b)`, { start: 3, end: 3, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1,url(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(false)
		expect(rereadsAnAddress(`1/url(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
	})

	it(`a separator solidus behind a star, which closes no comment and so is text of the name's word, and one closing a comment, which ends the word in front of it`, () => {
		expect(rereadsAnAddress(`1 */url(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1 */ url(a"b)`, { start: 4, end: 5, text: `` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`"/*" */url(a ")" b)`, { start: 7, end: 7, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`url(/*) */url(a ")" b)`, { start: 10, end: 10, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1 /* a */ b */url(a ")" b)`, { start: 14, end: 14, text: ` ` }, POSTCSS)).toBe(true)
		expect(rereadsAnAddress(`1,/* c */url(a ")" b)`, { start: 9, end: 9, text: ` ` }, POSTCSS)).toBe(false)
	})

	it(`the url token of a parser whose own tokenizer reads one, which opens behind whitespace and closes by the count of parentheses through strings, comments, interpolations and escapes, against the code reading with its square-bracket groups`, () => {
		expect(rereadsAnAddress(`1/url ( a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( "a)" )`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( a // )\n b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( a /* ) */ b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( #{")"} )`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( "(" a))`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( a(b )`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( a(b"c)d"e) )`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( a\\)b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url(a[b"c") } d ])`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( "#{"); "}" )`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(true)
		expect(rereadsAnAddress(`1/url( a(b)c )`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(false)
		expect(rereadsAnAddress(`1/url(a[b)`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(false)
		expect(rereadsAnAddress(`1/url("a)")`, { start: 2, end: 2, text: ` ` }, SCSS)).toBe(false)
	})

	it(`an edit not standing in front of the name`, () => {
		expect(rereadsAnAddress(`1, url(a"b)`, { start: 2, end: 2, text: `\n` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,URL(a"b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
		expect(rereadsAnAddress(`1,aurl(a"b)`, { start: 2, end: 2, text: ` ` }, POSTCSS)).toBe(false)
	})

	it(`a name joined to a vertical tab, which a written space parts`, () => {
		expect(rereadsAnAddress(`1,url(a"b)`, { start: 3, end: 3, text: ` ` }, POSTCSS)).toBe(true)
	})
})
