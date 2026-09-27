import { atRule, decl } from "postcss"
import { describe, expect, it } from "vitest"

import { addressHolding, editsRereadAnAddress, rereadsAnAddress } from "./index.ts"

let POSTCSS = { tokenizes: false }
let SCSS = { tokenizes: true }
let DECLARATION = decl({ prop: `b`, value: `` })
let CUSTOM_PROPERTY = decl({ prop: `--b`, value: `` })
let MEDIA = atRule({ name: `media` })

describe(`rereadsAnAddress`, () => {
	it(`a space parting the name from a comma, in front of a string holding the closing parenthesis`, () => {
		expect(rereadsAnAddress(`1,url(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a run taken away, which joins the name to the comma in front of a quotation mark nothing closes`, () => {
		expect(rereadsAnAddress(`1, url(a"b)`, { start: 2, end: 3, text: `` }, POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a break parting the name from a solidus, in front of a group nothing closes`, () => {
		expect(rereadsAnAddress(`1/url(a(b)`, { start: 2, end: 2, text: `\n` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`@media (a,url(a(b))`, { start: 10, end: 10, text: ` ` }, POSTCSS, MEDIA)).toBe(true)
	})

	it(`a group code reads inside the parentheses, which the token's parenthesis closes early and the parser passes over, and a square bracket inside parentheses both readings take as one token`, () => {
		expect(rereadsAnAddress(`1/url(a[b)`, { start: 2, end: 2, text: `\n` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1!url(a(b)c) 2px`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url(a(b)c.png)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`f(1,url(a(b)c))`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url(a(b) /* c */ d)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a semicolon, a brace or a colon the token's early parenthesis leaves outside the group code reads it inside`, () => {
		expect(rereadsAnAddress(`f(1,url(a(b)c);d)`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`f(1,url(a(b)c){d})`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url(x(y)z:w)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a comma the token's early parenthesis moves out of the group code holds it in, which the comma rules then read as an item of the list around the address`, () => {
		expect(rereadsAnAddress(`1,url(a(b)c,d) 2px`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`a,url(a(b)c,d)`, { start: 2, end: 2, text: `\n` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`(a,url(a(b)c,d))`, { start: 3, end: 3, text: ` ` }, POSTCSS, MEDIA)).toBe(true)
	})

	it(`a comma the token's early parenthesis moves out of a group inside a call it stays in, which no list rule reads either way`, () => {
		expect(rereadsAnAddress(`f(1,url(a(b)c,d))`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`@media (a: f(1,url(a(b)c,d)))`, { start: 16, end: 16, text: ` ` }, POSTCSS, MEDIA)).toBe(false)
	})

	it(`a sign the value parser keeps in the word in front of the name, which then names a call of its own holding the comma the token lets out`, () => {
		expect(rereadsAnAddress(`f(1!url(a(b)c,d))`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a colon of params under a parser whose own tokenizer reads the address, whose token the media rules read apart from the walk`, () => {
		expect(rereadsAnAddress(`(c: [c\\]a>= url(a(b"c)d"e))) { a { b: 1px; } }`, { start: 11, end: 12, text: `` }, SCSS, MEDIA)).toBe(true)
	})

	it(`a comma of params the token's early parenthesis moves out of a call into parentheses behind a media query combinator, which the list rule reads as no call's`, () => {
		expect(rereadsAnAddress(`not(a,url(a(b)c,d))`, { start: 6, end: 6, text: ` ` }, POSTCSS, MEDIA)).toBe(true)
	})

	it(`a colon or a brace of a custom property's value the token's early parenthesis lets out of the group, which the parser reads as the value's all the same`, () => {
		expect(rereadsAnAddress(`1,url(a(b)c:d)`, { start: 2, end: 2, text: ` ` }, POSTCSS, CUSTOM_PROPERTY)).toBe(false)
		expect(rereadsAnAddress(`1,url(a(b)c{d})`, { start: 2, end: 2, text: ` ` }, POSTCSS, CUSTOM_PROPERTY)).toBe(false)
		expect(rereadsAnAddress(`1,url(a(b)c;d)`, { start: 2, end: 2, text: ` ` }, POSTCSS, CUSTOM_PROPERTY)).toBe(true)
		expect(rereadsAnAddress(`1,url(a(b)c}d)`, { start: 2, end: 2, text: ` ` }, POSTCSS, CUSTOM_PROPERTY)).toBe(true)
	})

	it(`parentheses no parenthesis closes, and a comment nothing closes or one covering the parenthesis that closes the token`, () => {
		expect(rereadsAnAddress(`1,url(a/*)"*/b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url(a/*)*/b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url(a`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url(a/*b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a parenthesis escaped by a backslash, which closes nothing, in front of a quotation mark`, () => {
		expect(rereadsAnAddress(`1,url(a\\)"b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url(a\\\\)"b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`an address both readings close at the same parenthesis`, () => {
		expect(rereadsAnAddress(`1,url(a/b.png)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url(a "/*" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a quotation mark or whitespace behind the opening parenthesis, which leaves the parentheses code under both words`, () => {
		expect(rereadsAnAddress(`1,url("a)")`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url( ")" )`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a vertical tab behind the opening parenthesis, which is a word to the tokenizer`, () => {
		expect(rereadsAnAddress(`1,url(")")`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
	})

	it(`an edit leaving the name where it was read`, () => {
		expect(rereadsAnAddress(`1, url(a"b)`, { start: 2, end: 3, text: `\n` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,/* c */url(a"b)`, { start: 9, end: 9, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`(url(a"b)`, { start: 1, end: 1, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`whitespace or a comment between the name and the opening parenthesis, which leave the name the last word read`, () => {
		expect(rereadsAnAddress(`1,url (a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1, url/**/(a"b)`, { start: 2, end: 3, text: `` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url a(b"c)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a string, an at-word, an escape or a character read as a token of its own between the name and the opening parenthesis, which push no word either, and a word, which takes the name's place`, () => {
		expect(rereadsAnAddress(`1,url"x"(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url'x'(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url"#{"}"}"(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url@x,(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url\\,(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url\\\\(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url\\6a (a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url\\ (a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url[](a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url)(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`f(1,url)(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`f(1,url)(a ")" b)`, { start: 4, end: 4, text: `\n` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`f(1,\nurl)(a"b)`, { start: 4, end: 5, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`f(1,url"x")(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`\\(1,url)(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`(a) 1,url)(a ")" b)`, { start: 6, end: 6, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url"x"@y/*c*/\\,(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1, url"x"(a"b)`, { start: 2, end: 3, text: `` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url\\(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url\\/(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url\\\u{1F600}(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url[x](a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url!(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url#(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url,(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url#{a}(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,url // c\n(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a comma, an interpolation or a comment to the end of the line between the name and the opening parenthesis, which push no word under a parser whose own tokenizer reads them`, () => {
		expect(rereadsAnAddress(`1/url,(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url,,(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url#{a}(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url#{"("}(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url // c\n(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url"#{"}"}"(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url@x(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url // c(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1/url#(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
	})

	it(`an escaped character in front of the name, which is a word of its own`, () => {
		expect(rereadsAnAddress(`a\\, url(a"b)`, { start: 3, end: 4, text: `` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`a\\\\, url(a"b)`, { start: 4, end: 5, text: `` }, POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a comma under a parser whose own tokenizer ends a word on it, except inside an at-word`, () => {
		expect(rereadsAnAddress(`@a,url(a ")" b)`, { start: 3, end: 3, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,url(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1/url(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
	})

	it(`a separator solidus behind a star, which closes no comment and so is text of the name's word, and one closing a comment, which ends the word in front of it`, () => {
		expect(rereadsAnAddress(`1 */url(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1 */ url(a"b)`, { start: 4, end: 5, text: `` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`"/*" */url(a ")" b)`, { start: 7, end: 7, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`url(/*) */url(a ")" b)`, { start: 10, end: 10, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1 /* a */ b */url(a ")" b)`, { start: 14, end: 14, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1,/* c */url(a ")" b)`, { start: 9, end: 9, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`the url token of a parser whose own tokenizer reads one, which opens behind whitespace and closes by the count of parentheses through strings, comments, interpolations and escapes, against the code reading with its square-bracket groups, where a parenthesis closing the token early lets a semicolon or a brace out of the group`, () => {
		expect(rereadsAnAddress(`1/url ( a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url( "a)" )`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url( a // )\n b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url( a /* ) */ b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url( #{")"} )`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url( a(b )`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url( a(b"c)d"e) ; )`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url( a\\)b ; )`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1! url( a\\// c )`, { start: 2, end: 3, text: `` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url(a[b"c") } d ])`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url( "#{"); "}" )`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url( a(b)c )`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1/url( "(" a))`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1/url( a(b"c)d"e) )`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1/url( a\\)b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1/url(a[b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1/url("a)")`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
	})

	it(`an edit not standing in front of the name`, () => {
		expect(rereadsAnAddress(`1, url(a"b)`, { start: 2, end: 2, text: `\n` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,URL(a"b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1,aurl(a"b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a name joined to a vertical tab, which a written space parts`, () => {
		expect(rereadsAnAddress(`1,url(a"b)`, { start: 3, end: 3, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a word standing over the name on the tokenizer's stack, which parentheses of its own pop, leaving the name the word the next parenthesis pops`, () => {
		expect(rereadsAnAddress(`1/url x(y)(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url x y(z)(w)(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url[x](y)(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url url(y)(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
		expect(rereadsAnAddress(`1/url x(y)(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(true)
	})

	it(`a word over the name no parentheses pop, which leaves the name under a word at every parenthesis`, () => {
		expect(rereadsAnAddress(`1/url x(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`1/url x(y)(z)(a ")" b)`, { start: 2, end: 2, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
	})

	it(`parentheses PostCSS reads as code, which push the words inside them and keep every parenthesis to their content's end code as well`, () => {
		expect(rereadsAnAddress(`f(1,url x(y)(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`f(1,url x(y)(z)(a ")" b)`, { start: 4, end: 4, text: ` ` }, POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a double slash joined to the name, which the tokenizer reads into the name's word rather than as a comment`, () => {
		expect(rereadsAnAddress(`1/url// c\n(a ")" b)`, { start: 2, end: 2, text: ` ` }, SCSS, DECLARATION)).toBe(false)
		expect(rereadsAnAddress(`@a,url// c\n(a ")" b)`, { start: 3, end: 3, text: ` ` }, SCSS, DECLARATION)).toBe(false)
	})
})

describe(`editsRereadAnAddress`, () => {
	it(`a space written behind the parenthesis of a name the compilers read as no address, in front of a quotation mark nothing closes`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url(a"b)`, [{ start: 8, end: 8, text: ` ` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(String.raw`x\9 url(a"b)`, [{ start: 8, end: 8, text: ` ` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(`@{p}url(a"b)`, [{ start: 8, end: 8, text: ` ` }], POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a break written there, which the tokenizer reads as the space does`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url(a"b)`, [{ start: 8, end: 8, text: `\n` }], POSTCSS, DECLARATION)).toBe(true)
	})

	it(`the run taken away, which hands the parentheses back to the token`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url( a ")" b)`, [{ start: 8, end: 9, text: `` }], POSTCSS, DECLARATION)).toBe(true)
	})

	it(`parentheses both readings close at the same parenthesis`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url(a.png)`, [{ start: 8, end: 8, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a quotation mark behind the parenthesis, which keeps the parentheses code under PostCSS's tokenizer and opens the token under postcss-scss's`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url("a(b")`, [{ start: 8, end: 8, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
		expect(editsRereadAnAddress(String.raw`\61 url("a(b")`, [{ start: 8, end: 8, text: ` ` }], SCSS, DECLARATION)).toBe(true)
	})

	it(`the run in front of the closing parenthesis, which holds no character the tokenizer reads the parentheses by`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url(a"b )`, [{ start: 11, end: 12, text: `` }], POSTCSS, DECLARATION)).toBe(false)
		expect(editsRereadAnAddress(String.raw`\61 url(a"b)`, [{ start: 11, end: 11, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a name the tokenizer pops as a word of its own, which opens no token`, () => {
		expect(editsRereadAnAddress(String.raw`\75 rl(a"b)`, [{ start: 7, end: 7, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
		expect(editsRereadAnAddress(`URL(a"b)`, [{ start: 4, end: 4, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
		expect(editsRereadAnAddress(`aurl(a"b)`, [{ start: 5, end: 5, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a word standing over the name, which parentheses of its own pop`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url x(y)(a"b)`, [{ start: 13, end: 13, text: ` ` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(String.raw`\61 url x(y)(a"b)`, [{ start: 10, end: 10, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a break written into the parentheses of that word, which makes them code and leaves a word of theirs on the stack for the next parenthesis to pop`, () => {
		expect(editsRereadAnAddress(`url x(y)(a"b)`, [{ start: 6, end: 6, text: `\n` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(`url x(y)(a"b)`, [{ start: 7, end: 7, text: `\n` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(`url x(y)( a"b)`, [{ start: 6, end: 6, text: `\n` }], SCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(`url x(y)(a.png)`, [{ start: 6, end: 6, text: `\n` }], POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a break written right behind a string of a later call, along with one that makes an address a token under postcss-scss, which leaves the string where it was`, () => {
		expect(editsRereadAnAddress(`url("a") f("b")`, [{ start: 4, end: 4, text: `\n` }, { start: 14, end: 14, text: `\n` }], SCSS, DECLARATION)).toBe(false)
	})

	it(`the last break taken out of those parentheses, which hands the next parenthesis the name again`, () => {
		expect(editsRereadAnAddress(`url x(y\n)(a(b)c;d) 2px`, [{ start: 7, end: 8, text: `` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(`url x(\ny\n)(a(b)c;d) 2px`, [{ start: 6, end: 7, text: `` }], POSTCSS, DECLARATION)).toBe(false)
		expect(editsRereadAnAddress(`url x(\ny\n)(a(b)c;d) 2px`, [{ start: 6, end: 7, text: `` }, { start: 8, end: 9, text: `` }], POSTCSS, DECLARATION)).toBe(true)
	})

	it(`parentheses the reading that is not the address's takes as one plain token, which closes where the address's token closes`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url(a[b.png)`, [{ start: 8, end: 8, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
	})

	it(`the same parentheses inside a call PostCSS read as code, which leaves every parenthesis to its content's end code as well`, () => {
		expect(editsRereadAnAddress(String.raw`f( \61 url(a[b.png) ) 1px`, [{ start: 11, end: 11, text: ` ` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(String.raw`f( \61 url(a(b.png) ) 1px`, [{ start: 11, end: 11, text: ` ` }], POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a group code reads inside the parentheses, which close at a parenthesis of their own under either reading`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url(a(b)c.png)`, [{ start: 8, end: 8, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a group nothing closes, which leaves the parentheses open where code reads it`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url(a(b.png)`, [{ start: 8, end: 8, text: ` ` }], POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a comment of code holding the parenthesis the token closes at, which the token leaves unopened`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url( a /* ) */ )`, [{ start: 8, end: 9, text: `` }], POSTCSS, DECLARATION)).toBe(true)
	})

	it(`parentheses the token swallows, which the parser reads nothing of`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url(a(b"c)`, [{ start: 10, end: 10, text: ` ` }], POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a semicolon, a brace or a colon behind a group code reads inside the parentheses, which the token's early parenthesis lets out of the group`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url( a(b)c;d) 2px`, [{ start: 8, end: 9, text: `` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(String.raw`\61 url( a(b)c{d}) 2px`, [{ start: 8, end: 9, text: `` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(String.raw`\61 url( x(y)z:w) 2px`, [{ start: 8, end: 9, text: `` }], POSTCSS, DECLARATION)).toBe(true)
		expect(editsRereadAnAddress(String.raw`\61 url( a(b)c;d) 2px`, [{ start: 8, end: 9, text: `` }], SCSS, DECLARATION)).toBe(false)
	})

	it(`a colon or a brace of a custom property's value behind a group code reads inside the parentheses, which the parser holds in the value either way`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url( a(b)c:d)`, [{ start: 8, end: 9, text: `` }], POSTCSS, CUSTOM_PROPERTY)).toBe(false)
		expect(editsRereadAnAddress(String.raw`\61 url(a(b)c{d} )`, [{ start: 8, end: 8, text: ` ` }], POSTCSS, CUSTOM_PROPERTY)).toBe(false)
		expect(editsRereadAnAddress(String.raw`\61 url( a(b)c;d)`, [{ start: 8, end: 9, text: `` }], POSTCSS, CUSTOM_PROPERTY)).toBe(true)
	})

	it(`a comma behind a group code reads inside the parentheses, which the token's early parenthesis leaves inside the call around them`, () => {
		expect(editsRereadAnAddress(`f(\\61 url(\na(b)c,d))`, [{ start: 10, end: 11, text: `` }], POSTCSS, DECLARATION)).toBe(false)
		expect(editsRereadAnAddress(`1,\\61 url(\na(b)c,d)`, [{ start: 10, end: 11, text: `` }], POSTCSS, DECLARATION)).toBe(true)
	})

	it(`a colon or a comma of params the token's early parenthesis moves between parentheses no name opens, which the media feature and list rules read either way`, () => {
		expect(editsRereadAnAddress(`a url x(y)(a(b)c:d)`, [{ start: 11, end: 11, text: ` ` }], POSTCSS, MEDIA)).toBe(false)
		expect(editsRereadAnAddress(`a url x(y)( a(b)c,d)`, [{ start: 11, end: 12, text: `` }], POSTCSS, MEDIA)).toBe(false)
		expect(editsRereadAnAddress(`(a: f(1, url x(y)( a(b)c,d)))`, [{ start: 18, end: 19, text: `` }], POSTCSS, MEDIA)).toBe(false)
		expect(editsRereadAnAddress(`(a: f(1, url x(y)( a(b)c,d)))`, [{ start: 18, end: 19, text: `` }], POSTCSS, DECLARATION)).toBe(false)
	})

	it(`a colon of params inside parentheses behind a name the media rules read as a call's and style-search as none, or the other way round`, () => {
		expect(editsRereadAnAddress(`(a: é(\\61 url( a(b)c:d)))`, [{ start: 14, end: 15, text: `` }], POSTCSS, MEDIA)).toBe(false)
		expect(editsRereadAnAddress(`(a: 1a(\\61 url( a(b)c:d)))`, [{ start: 15, end: 16, text: `` }], POSTCSS, MEDIA)).toBe(true)
	})

	it(`a colon of params inside parentheses behind a hexadecimal escape closed by a Windows line break, which the list rule reads as a call's either way`, () => {
		expect(editsRereadAnAddress(`(a: \\61\r\n(\\61 url( a(b)c:d)))`, [{ start: 18, end: 19, text: `` }], POSTCSS, MEDIA)).toBe(false)
	})

	it(`a comma of params the token's early parenthesis moves out of parentheses behind a percent sign or an escape, which the list rule reads as a call's`, () => {
		expect(editsRereadAnAddress(`%(\\61 url( a(b)c),d)`, [{ start: 10, end: 11, text: `` }], POSTCSS, MEDIA)).toBe(true)
		expect(editsRereadAnAddress(`\\61 (\\61 url( a(b)c),d)`, [{ start: 13, end: 14, text: `` }], POSTCSS, MEDIA)).toBe(true)
		expect(editsRereadAnAddress(`(\\61 url( a(b)c),d)`, [{ start: 10, end: 11, text: `` }], POSTCSS, MEDIA)).toBe(false)
	})

	it(`two runs taken away around a comment, the cuts behind both moved by the two`, () => {
		expect(editsRereadAnAddress(String.raw`\61 url( /* c */ a.png); d`, [{ start: 8, end: 9, text: `` }, { start: 16, end: 17, text: `` }], POSTCSS, DECLARATION)).toBe(false)
	})
})

describe(`addressHolding`, () => {
	it(`an index inside an address's token, which PostCSS's tokenizer closes at the first parenthesis and postcss-scss's by the count of parentheses`, () => {
		expect(addressHolding(`url (a(b,c)`, 8, POSTCSS)).toBe(4)
		expect(addressHolding(`url (a(b)c,d)`, 10, POSTCSS)).toBe(-1)
		expect(addressHolding(`url (a(b)c,d)`, 10, SCSS)).toBe(4)
	})

	it(`an index in front of the address or behind it, and parentheses that pop another word`, () => {
		expect(addressHolding(`a,url(b)`, 1, POSTCSS)).toBe(-1)
		expect(addressHolding(`url(b) c,d`, 8, POSTCSS)).toBe(-1)
		expect(addressHolding(`url x(b,c)`, 7, POSTCSS)).toBe(-1)
	})
})
