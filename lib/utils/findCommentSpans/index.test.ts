import valueParser, { type Node } from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { findAddressSpans, findCommentSpanAt, findCommentSpanHolding, findCommentSpans, findCommentSpanTouching, findStringSpans } from "./index.ts"

/** Plain CSS, which spells no `//` comment. */
const PLAIN_CSS = { spells: false, tokenizes: false, endsOnFormFeed: false }

/** `postcss-scss`, whose own tokenizer reads a `//` comment, so the parentheses of an address are read as Sass reads them. */
const SCSS = { spells: true, tokenizes: true, endsOnFormFeed: true }

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

	// See #378
	it(`a slash and a star inside a bare address, which are two characters of the address to every tokenizer and open no comment`, () => {
		expect(findCommentSpans(`url(a/* x) 1PX /* c */ 3PX`)).toEqual([{ start: 15, end: 22, isInline: false }])
		expect(findCommentSpans(`url(a/* x) 1PX // c`)).toEqual([{ start: 15, end: 19, isInline: true }])
		expect(findCommentSpans(`url(a/*)b*/) // c`)).toEqual([{ start: 13, end: 17, isInline: true }])
	})

	// See #504
	it(`a quotation mark inside a bare address, which is a character of the address to every tokenizer and opens no string, so that the marks behind the address pair as the file pairs them`, () => {
		expect(findCommentSpans(`url(a"b)c" /* " */ "d"`)).toEqual([])
		expect(findCommentSpans(`url(a'b)c' // '\n'd'`)).toEqual([])
		expect(findCommentSpans(`url(a"b)c) /* x */ 2PX`)).toEqual([{ start: 11, end: 18, isInline: false }])
	})

	it(`a quotation mark inside an address whitespace parts from its parenthesis, which is a string's to PostCSS and to postcss-less, and a file postcss-scss refuses`, () => {
		expect(findCommentSpans(`url( "a)b" ) /* c */`)).toEqual([{ start: 13, end: 20, isInline: false }])
	})

	it(`a block comment beside a quoted address inside the parentheses, which is a comment to every tokenizer`, () => {
		expect(findCommentSpans(`url("a" /*/ 'x' */) 'y'`)).toEqual([{ start: 8, end: 18, isInline: false }])
		expect(findCommentSpans(`url("a" /* c */ x) /* d */`)).toEqual([{ start: 8, end: 15, isInline: false }, { start: 19, end: 26, isInline: false }])
	})

	// The walk read those slashes as code and the guard over a fix as a comment, which is what Sass reads there. See #557
	it(`a double slash beside a quoted address, which opens a comment wherever the quotation mark stands`, () => {
		expect(findCommentSpans(`url("a" // c)`)).toEqual([{ start: 8, end: 13, isInline: true }])
		expect(findCommentSpans(`url("a" // c)`, PLAIN_CSS)).toEqual([])
		expect(findCommentSpans(`url( "a" // c\n) 1px`)).toEqual([{ start: 9, end: 13, isInline: true }])
	})

	// See #557
	it(`a block comment beside a quoted address whitespace parts from its parenthesis, which PostCSS reads as a comment and postcss-scss as one bracket token`, () => {
		expect(findCommentSpans(`url( "a" /* c */ )`)).toEqual([{ start: 9, end: 16, isInline: false }])
	})

	it(`a comment beside a quoted address whose parentheses the text closes with none, which the walk reads to the end of the string and on in code`, () => {
		expect(findCommentSpans(`url("a" /* c */ x`)).toEqual([{ start: 8, end: 15, isInline: false }])
	})

	// The walk read the whole of an unclosed `url(` over again as code and found a comment inside it, where the guard over a fix read the address to the end of the text. See #557
	it(`a bare address whose parentheses the text closes with none, which runs to that text's end`, () => {
		expect(findCommentSpans(`url(a//b`)).toEqual([])
		expect(findCommentSpans(`url(a/*b`)).toEqual([])
	})

	// Sass compiles the declaration to the address and the comment, where the tokenizers read the no-break space as the first character of a bare address. See #557
	it(`a comment beside a quoted address a no-break space parts from the parenthesis, which is whitespace to no tokenizer`, () => {
		expect(findCommentSpans(`url(\u00A0"a" /* c */)`)).toEqual([{ start: 9, end: 16, isInline: false }])
	})

	// The tokenizer takes one token of the parentheses wherever the `(` is met by anything but its own whitespace, and where it does not, the comment written there is a comment to it. See #660
	it(`a comment inside an address the tokenizer's whitespace parts from its parenthesis, which the parenthesis closing the address then stands outside of`, () => {
		expect(findCommentSpans(`url( a /* c */ )`)).toEqual([{ start: 7, end: 14, isInline: false }])
		expect(findCommentSpans(`url( a /* ) */ ) 1PX`)).toEqual([{ start: 7, end: 14, isInline: false }])
		expect(findCommentSpans(`url(\na /* c */ )`)).toEqual([{ start: 7, end: 14, isInline: false }])
	})

	// See #660
	it(`the same comment behind a no-break space, which is no whitespace to the tokenizer and leaves the parentheses one token of it`, () => {
		expect(findCommentSpans(`url(\u00A0a /* ) */ ) 1PX`)).toEqual([])
	})

	// A string inside parentheses whose comments are read hides the delimiter and the parenthesis it holds
	it(`a string holding a delimiter inside parentheses whose comments are read, and the comment behind the call`, () => {
		expect(findCommentSpans(`url( a "/*" b/c) /* d */`)).toEqual([{ start: 17, end: 24, isInline: false }])
		expect(findCommentSpans(`url(a "/*" b/c) // d`, SCSS)).toEqual([{ start: 16, end: 20, isInline: true }])
	})

	// See #661
	it(`a comment holding a parenthesis inside an address Sass reads as code, which the parser Sass is read by reads as one`, () => {
		expect(findCommentSpans(`url(a /* ) / b */ ) 1PX`, SCSS)).toEqual([{ start: 6, end: 17, isInline: false }])
		expect(findCommentSpans(`url(a /* ) / b */ ) 1PX`)).toEqual([])
		expect(findCommentSpans(`url(a // ) , b\n) 1PX`, SCSS)).toEqual([{ start: 6, end: 14, isInline: true }])
	})

	it(`a slash and a star inside such an address whose closing delimiter lies past the parenthesis, which the tokenizer reads to that delimiter and past the parenthesis with it`, () => {
		expect(findCommentSpans(`url( a/* x) 1PX /* c */ 3PX`)).toEqual([{ start: 6, end: 23, isInline: false }])
		expect(findCommentSpans(`url( a/* x) 1PX // c`)).toEqual([{ start: 6, end: 20, isInline: false }])
	})

	// See #664
	it(`a comment inside an address whose name is spelled other than the word itself, which every parser reads as one`, () => {
		expect(findCommentSpans(`URL(a /* ) / b */ ) 1PX`)).toEqual([{ start: 6, end: 17, isInline: false }])
		expect(findCommentSpans(`u\\rl(a/*c*/) 1PX`)).toEqual([{ start: 6, end: 11, isInline: false }])
	})

	// The tokenizer glues a solidus or a comma to the name and reads the parentheses as code
	it(`a comment holding a parenthesis inside an address whose name a solidus or a comma is glued to`, () => {
		expect(findCommentSpans(`x /url(a/* ) / b */) 1PX`)).toEqual([{ start: 8, end: 19, isInline: false }])
		expect(findCommentSpans(`1,url(a/*)*/) 1PX`, PLAIN_CSS)).toEqual([{ start: 7, end: 12, isInline: false }])
	})

	// A sign the value parser keeps in the word too makes a call, as a letter does
	it(`comments of both kinds inside the parentheses of a call whose name a sign other than a solidus or a comma is glued to`, () => {
		expect(findCommentSpans(`$url(a // ) , b\n) 1PX`)).toEqual([{ start: 7, end: 15, isInline: true }])
		expect(findCommentSpans(`!url(a/* ) " */) "x" 1PX`, PLAIN_CSS)).toEqual([{ start: 6, end: 15, isInline: false }])
	})

	// Every case below stands on an escape, which the scan used to read as an ordinary character everywhere but inside an address or a quoted string. See #321
	it(`a double slash whose first character an escape spells`, () => {
		expect(findCommentSpans(`a\\//b 1px`)).toEqual([])
	})

	// See #517
	it(`the same double slash under a syntax whose own tokenizer reads such a comment, which lets no backslash cover its solidus`, () => {
		expect(findCommentSpans(`a\\//b 1px`, SCSS)).toEqual([{ start: 2, end: 9, isInline: true }])
	})

	// `postcss-scss` reads no comment inside the parentheses it takes as one token behind the word, and Sass reads the escape there
	it(`the same double slash inside such parentheses behind a name the word ends after an escape or an interpolation, and behind a pair of parentheses inside them`, () => {
		expect(findCommentSpans(`\\61 url( a\\// c ) 1px`, SCSS)).toEqual([])
		expect(findCommentSpans(`#{$p}url( a\\// c ) 1px`, SCSS)).toEqual([])
		expect(findCommentSpans(`url( a( b ) \\//c ) 1px`, SCSS)).toEqual([])
	})

	// The tokenizer ends the token on the first parenthesis to balance it, and reads the comment behind that one
	it(`the same double slash behind a parenthesis a backslash stands in front of, behind one inside a comment or a string, and behind the token`, () => {
		expect(findCommentSpans(`\\61 url( a\\) \\//c ) 1px`, SCSS)).toEqual([{ start: 14, end: 23, isInline: true }])
		expect(findCommentSpans(`\\61 url( /* ) */ \\//c ) 1px`, SCSS)).toEqual([{ start: 9, end: 16, isInline: false }, { start: 18, end: 27, isInline: true }])
		expect(findCommentSpans(`\\61 url( a\\//" ) \\//c " 1px`, SCSS)).toEqual([{ start: 18, end: 27, isInline: true }])
		expect(findCommentSpans(`\\61 url(a) \\//c 1px`, SCSS)).toEqual([{ start: 12, end: 19, isInline: true }])
	})

	// Each of these ends a token, so the word behind it is one of its own
	it(`the same double slash inside such parentheses behind a closing parenthesis, a bare address and a line an inline comment ends`, () => {
		expect(findCommentSpans(`a)url(a(b)\\//c) 1px`, SCSS)).toEqual([])
		expect(findCommentSpans(`url(a)url(a(b)\\//c) 1px`, SCSS)).toEqual([])
		expect(findCommentSpans(`// c\nurl(a(b)\\//c) 1px`, SCSS)).toEqual([{ start: 0, end: 4, isInline: true }])
	})

	// The tokenizer reads an interpolation whole, so a word inside it opens no token, and the one it closes past the parentheses is read as none
	it(`the same double slash behind parentheses an interpolation opens in front of and closes inside`, () => {
		expect(findCommentSpans(`#{ url( a( b ) } \\//c ) 1px`, SCSS)).toEqual([{ start: 18, end: 27, isInline: true }])
	})

	// The tokenizer ends a word at a quotation mark and in front of `/*`, so a `url` behind a string or a comment is a word of its own, and Sass reads the escape there
	it(`the same double slash inside such parentheses behind a string and behind a block comment standing against the word`, () => {
		expect(findCommentSpans(`'x'url( a(b) \\// c ) 1px`, SCSS)).toEqual([])
		expect(findCommentSpans(`x /*c*/url( a(b) \\// c ) 1px`, SCSS)).toEqual([{ start: 2, end: 7, isInline: false }])
	})

	// The tokenizer reads a word of its own in `aurl` and `/url`, and parentheses a quotation mark stands against as code
	it(`the same double slash where the tokenizer takes no such token`, () => {
		expect(findCommentSpans(`aurl(a\\//c) 1px`, SCSS)).toEqual([{ start: 7, end: 15, isInline: true }])
		expect(findCommentSpans(`\\/url(a\\//c) 1px`, SCSS)).toEqual([{ start: 8, end: 16, isInline: true }])
		expect(findCommentSpans(`url("a" \\//c) 1px`, SCSS)).toEqual([{ start: 9, end: 17, isInline: true }])
	})

	// The tokenizer asks only the character behind the parenthesis, so whitespace in front of the quotation mark keeps the token, and Sass reads the escape there
	it(`the same double slash behind a string opening such parentheses after whitespace`, () => {
		expect(findCommentSpans(`\\61 url( "a" \\//c ) 1px`, SCSS)).toEqual([])
		expect(findCommentSpans(`url( 'a' \\// c ) 1px`, SCSS)).toEqual([])
		expect(findCommentSpans(`url(\n'a' \\// c\n) 1px`, SCSS)).toEqual([])
	})

	// The grammar reads the escape and PostCSS's tokenizer lets none cover a solidus, so all three parsers hand back the declaration with the comment cut out of its value. See #665
	it(`a slash an escape spells in front of a star, which the parsers read as a comment all the same`, () => {
		expect(findCommentSpans(`a\\/*c*/ 1px`)).toEqual([{ start: 2, end: 7, isInline: false }])
	})

	it(`the same delimiter behind an even run of backslashes and behind an escape spelling the solidus, neither of which ever covered it`, () => {
		expect(findCommentSpans(`a\\\\/*c*/ 1px`)).toEqual([{ start: 3, end: 8, isInline: false }])
		expect(findCommentSpans(`a\\2f/*c*/ 1px`)).toEqual([{ start: 4, end: 9, isInline: false }])
	})

	it(`a double slash behind an escape of the backslash itself`, () => {
		expect(findCommentSpans(`a\\\\//c`)).toEqual([{ start: 3, end: 6, isInline: true }])
	})

	it(`a comment behind a quotation mark an escape spells, which opens no string to run past it`, () => {
		expect(findCommentSpans(`a\\"b // c`)).toEqual([{ start: 5, end: 9, isInline: true }])
	})

	it(`a double slash belonging to an address whose name an escape spells`, () => {
		expect(findCommentSpans(`\\url(http://x/y.png)`)).toEqual([])
		expect(findCommentSpans(`u\\rl(http://x/y.png)`)).toEqual([])
		expect(findCommentSpans(`\\75 rl(http://x/y.png)`)).toEqual([])
		expect(findCommentSpans(`\\55 RL(http://x/y.png)`)).toEqual([])
	})

	it(`a double slash inside a call an escape spells the name of, which is no address`, () => {
		expect(findCommentSpans(`a\\url(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
		expect(findCommentSpans(`image-\\75 rl(http://x)`)).toEqual([{ start: 18, end: 22, isInline: true }])
	})

	it(`a name an escape opens standing in front of the address, whose last character tells nothing about it`, () => {
		expect(findCommentSpans(`\\61 \\75 rl(http://x)`)).toEqual([{ start: 16, end: 20, isInline: true }])
		expect(findCommentSpans(`\\\\\\75 rl(http://x)`)).toEqual([{ start: 14, end: 18, isInline: true }])
		expect(findCommentSpans(`\\61 url(http://x)`)).toEqual([{ start: 13, end: 17, isInline: true }])
		expect(findCommentSpans(`\\/url(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
	})

	it(`a backslash a break stands behind, which opens no name and leaves the address its own`, () => {
		expect(findCommentSpans(`\\\n url(http://x)`)).toEqual([])
	})

	it(`an address behind a string, a block comment or a comment of the other kind, none of which opens a name`, () => {
		expect(findCommentSpans(`a"b"url(http://x)`)).toEqual([])
		expect(findCommentSpans(`a'b'url(http://x)`)).toEqual([])
		expect(findCommentSpans(`a/*b*/url(http://x)`)).toEqual([{ start: 1, end: 6, isInline: false }])
		expect(findCommentSpans(`a// b\nurl(http://x)`)).toEqual([{ start: 1, end: 5, isInline: true }])
	})

	it(`a name spelled by an escape no code point answers to, which is no address either`, () => {
		expect(findCommentSpans(`\\0 rl(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
	})

	// The cases below stand on a name the scan used to read in ASCII word characters alone, so a call named otherwise came out an address. The last two, and the second half of the case putting one name in two spellings, pin what had to survive the widening: an escape opened a name whatever it spelled, so `\e9 url(` reached a call on either side of the branch where the name written as the character it spells did not. See #343
	it(`a double slash inside a call whose name opens on a code point outside ASCII`, () => {
		expect(findCommentSpans(`\u00E9url(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
	})

	it(`a name of several such code points`, () => {
		expect(findCommentSpans(`\u65E5\u672Curl(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
	})

	it(`a name of the middle dot, the one such code point the grammar names below the letters`, () => {
		expect(findCommentSpans(`\u00B7url(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
	})

	it(`a name of a character above the basic plane, whose two halves each answer for themselves`, () => {
		expect(findCommentSpans(`\u{1F600}url(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
	})

	it(`one such name written plainly and written as an escape, which are the same name`, () => {
		expect(findCommentSpans(`\u00E9\\75 rl(http://x)`)).toEqual([{ start: 13, end: 17, isInline: true }])
		expect(findCommentSpans(`\\e9 url(http://x)`)).toEqual([{ start: 13, end: 17, isInline: true }])
	})

	it(`a name of the four such code points the grammar names one at a time above the middle dot`, () => {
		expect(findCommentSpans(`\u200Curl(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
		expect(findCommentSpans(`\u200Durl(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
		expect(findCommentSpans(`\u203Furl(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
		expect(findCommentSpans(`\u2040url(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
	})

	it(`a name an interpolation closes, which the closing brace keeps a name`, () => {
		expect(findCommentSpans(`@{p}url(http://x)`)).toEqual([{ start: 13, end: 17, isInline: true }])
		expect(findCommentSpans(`#{$p}url(http://x)`)).toEqual([{ start: 14, end: 18, isInline: true }])
	})

	it(`whitespace between such a code point and the address, which leaves the address its own`, () => {
		expect(findCommentSpans(`\u00E9 url(http://x)`)).toEqual([])
	})

	it(`a comment a Windows pair closes, the carriage return of the pair staying outside the span with the line feed`, () => {
		expect(findCommentSpans(`1px // c\r
2px`)).toEqual([{ start: 4, end: 8, isInline: true }])
	})

	it(`a bare carriage return closing the comment, as Less and Sass read one, and a form feed inside it, which Less reads as its text`, () => {
		expect(findCommentSpans(`1px // c\r2px`)).toEqual([{ start: 4, end: 8, isInline: true }])
		expect(findCommentSpans(`1px // c\f2px`)).toEqual([{ start: 4, end: 12, isInline: true }])
	})

	it(`the same form feed under the syntax that closes a comment on one, which leaves what stands behind it code`, () => {
		expect(findCommentSpans(`1px // c\f2px`, SCSS)).toEqual([{ start: 4, end: 8, isInline: true }])
		expect(findCommentSpans(`1px // c\f2px // d`, SCSS)).toEqual([{ start: 4, end: 8, isInline: true }, { start: 13, end: 17, isInline: true }])
	})

	it(`a syntax spelling no comment with a double slash has none of that kind to find`, () => {
		expect(findCommentSpans(`1px // c\n2px`, PLAIN_CSS)).toEqual([])
		expect(findCommentSpans(`myurl(//a)`, PLAIN_CSS)).toEqual([])
	})

	it(`the second slash of such a syntax opens a block comment where a star follows it`, () => {
		expect(findCommentSpans(`1px//*c*/`, PLAIN_CSS)).toEqual([{ start: 4, end: 9, isInline: false }])
	})

	it(`a block comment of such a syntax is found as it always was`, () => {
		expect(findCommentSpans(`1px /* c */ 2px`, PLAIN_CSS)).toEqual([{ start: 4, end: 11, isInline: false }])
	})
})

// The other answer of the walk that finds the comments: the same reading of what a `url()` is, put to the addresses it steps over instead of the comments it steps around. See #427
describe(`findAddressSpans`, () => {
	it(`a text holding no call at all`, () => {
		expect(findAddressSpans(`1px 2px`)).toEqual([])
	})

	it(`a bare address`, () => {
		expect(findAddressSpans(`url(a.png)`)).toEqual([{ start: 4, end: 9 }])
	})

	it(`an address the whitespace at its edges is left off`, () => {
		expect(findAddressSpans(`url( a.png )`)).toEqual([{ start: 5, end: 10 }])
		expect(findAddressSpans(`url(\n\t"a.png"\n)`)).toEqual([{ start: 6, end: 13 }])
	})

	it(`parentheses holding nothing but whitespace, which hold no address`, () => {
		expect(findAddressSpans(`url()`)).toEqual([])
		expect(findAddressSpans(`url(   )`)).toEqual([])
	})

	it(`a call whose name merely ends in the three letters of an address`, () => {
		expect(findAddressSpans(`image-url(a.png)`)).toEqual([])
	})

	it(`a call whose name ends in a character no ASCII word holds`, () => {
		expect(findAddressSpans(`éurl(a.png)`)).toEqual([])
		expect(findAddressSpans(`@{p}url(a.png)`)).toEqual([])
	})

	it(`an address whose name is spelled with an escape`, () => {
		expect(findAddressSpans(`u\\rl(a.png)`)).toEqual([{ start: 5, end: 10 }])
		expect(findAddressSpans(`\\75 rl(a.png)`)).toEqual([{ start: 7, end: 12 }])
	})

	it(`an address written inside a comment or a string, which opens none`, () => {
		expect(findAddressSpans(`/* url(a.png) */`)).toEqual([])
		expect(findAddressSpans(`"url(a.png)"`)).toEqual([])
		expect(findAddressSpans(`// url(a.png)`)).toEqual([])
	})

	it(`the same double slash in a syntax that spells no comment with one, where the address behind it is an address`, () => {
		expect(findAddressSpans(`// url(a.png)`, PLAIN_CSS)).toEqual([{ start: 7, end: 12 }])
	})

	it(`two addresses on one line, and a call behind an address that is none`, () => {
		expect(findAddressSpans(`url(a.png) url(b.png)`)).toEqual([{ start: 4, end: 9 }, { start: 15, end: 20 }])
		expect(findAddressSpans(`url(a.png) f(1, 2)`)).toEqual([{ start: 4, end: 9 }])
	})

	it(`the arguments of the url function, of which only the string is an address`, () => {
		expect(findAddressSpans(`url("a" /* c */)`)).toEqual([{ start: 4, end: 7 }])
		expect(findAddressSpans(`url( "x", format("woff2"), a )`)).toEqual([{ start: 5, end: 8 }])
	})

	it(`the same arguments where the address is written with the other quotation mark`, () => {
		expect(findAddressSpans(`url('a.png', format('x'))`)).toEqual([{ start: 4, end: 11 }])
		expect(findAddressSpans(`url( 'a.png' , 1 )`)).toEqual([{ start: 5, end: 12 }])
	})

	it(`whitespace an escape at the end of an address spells, which is a character of the address and no run behind it`, () => {
		expect(findAddressSpans(`url(a\\ )`)).toEqual([{ start: 4, end: 7 }])
		expect(findAddressSpans(`url(aa\\41 )`)).toEqual([{ start: 4, end: 10 }])
	})

	it(`the same whitespace behind an escape of the backslash itself, which spells nothing and closes on none of it`, () => {
		expect(findAddressSpans(`url(a\\\\ )`)).toEqual([{ start: 4, end: 7 }])
		expect(findAddressSpans(`url(aa\\\\41 )`)).toEqual([{ start: 4, end: 10 }])
	})

	// Which whitespace a backslash spells is the grammar's reading, held once by the plugin and not by this module: a backslash in front of any of the four newlines spells nothing, the form feed and the bare carriage return of the last two lines among them, which used to be read as characters the escape spells (#566).
	it(`a line break behind an escape, which a hexadecimal one closes on and a backslash spells nothing in front of`, () => {
		expect(findAddressSpans(`url(a\\\n)`)).toEqual([{ start: 4, end: 6 }])
		expect(findAddressSpans(`url(a\\41\r\n)`)).toEqual([])
		expect(findAddressSpans(`url(a\\\f)`)).toEqual([{ start: 4, end: 6 }])
		expect(findAddressSpans(`url(a\\\r)`)).toEqual([{ start: 4, end: 6 }])
	})

	it(`a run reaching past the end of a line, which no address is`, () => {
		expect(findAddressSpans(`url(a b.png c\nd)`)).toEqual([])
		expect(findAddressSpans(`url(a\fb)`)).toEqual([{ start: 4, end: 7 }])
	})

	// The walk counted parentheses and read the whole of `url(a(b)c)` as one address, where the guard over a fix closed it on the first. See #557
	it(`a parenthesis inside a bare address, which closes it as the first parenthesis behind the address does`, () => {
		expect(findAddressSpans(`url(a(b.png) c d)`)).toEqual([{ start: 4, end: 11 }])
		expect(findAddressSpans(`url(a(b.png) c\nd)`)).toEqual([{ start: 4, end: 11 }])
	})

	it(`a quotation mark inside a bare address, which opens no argument of anything`, () => {
		expect(findAddressSpans(`url(a"b c)`)).toEqual([{ start: 4, end: 9 }])
	})

	// An address is one span, and a comment inside the parentheses parts the code they hold, so the room is the first run of it. See #660
	it(`a comment inside an address the tokenizer's whitespace parts from its parenthesis, which parts the room the address stands in`, () => {
		expect(findAddressSpans(`url( a /* c */ )`)).toEqual([{ start: 5, end: 6 }])
		expect(findAddressSpans(`url( /* c */ a.png )`)).toEqual([{ start: 13, end: 18 }])
		expect(findAddressSpans(`url( /* c */ a /* d */ b )`)).toEqual([{ start: 13, end: 14 }])
	})

	// The room ends where the comment opens, as it does for a comment no backslash stands in front of. See #665
	it(`a comment inside an address whose opening solidus a backslash stands in front of, which parts that room as any other comment does`, () => {
		expect(findAddressSpans(`url( a\\/*c*/ )`)).toEqual([{ start: 5, end: 7 }])
	})

	it(`the same address with the parenthesis standing against it, which the parsers read whole`, () => {
		expect(findAddressSpans(`url(a\\/*c*/ )`)).toEqual([{ start: 4, end: 11 }])
	})

	it(`the same whitespace with no comment behind it, and the same comment with no whitespace in front of it, neither of which parts anything`, () => {
		expect(findAddressSpans(`url( http://a/b.png )`)).toEqual([{ start: 5, end: 19 }])
		expect(findAddressSpans(`url(a /* c */ )`)).toEqual([{ start: 4, end: 13 }])
	})

	// See #661
	it(`the same comment with no whitespace in front of it under the parser Sass is read by, which parts the address as whitespace does`, () => {
		expect(findAddressSpans(`url(a /* c */ )`, SCSS)).toEqual([{ start: 4, end: 5 }])
	})

	// See #664
	it(`the same comment behind a name spelled other than the word itself, which parts the address under every parser`, () => {
		expect(findAddressSpans(`URL(a /* c */ )`)).toEqual([{ start: 4, end: 5 }])
	})

	// A sign the value parser keeps in the word too makes a call, as a letter does
	it(`no address behind a name a dollar sign or a bang is glued to, and one behind a solidus`, () => {
		expect(findAddressSpans(`$url(a) !url(b) /url(c)`)).toEqual([{ start: 21, end: 22 }])
	})

	// See #557
	it(`an address whose parentheses the text closes with none, which runs to that text's end`, () => {
		expect(findAddressSpans(`url(a.png`)).toEqual([{ start: 4, end: 9 }])
		expect(findAddressSpans(`url("a" /* c */`)).toEqual([{ start: 4, end: 7 }])
		expect(findAddressSpans(`url("a`)).toEqual([])
	})

	// See #552
	it(`the address an import names, which is the string standing behind the name, quotation marks and all`, () => {
		expect(findAddressSpans(`@import "a.css";`)).toEqual([{ start: 8, end: 15 }])
		expect(findAddressSpans(`@import "a.css" screen, tv`)).toEqual([{ start: 8, end: 15 }])
	})

	it(`the same address with no whitespace in front of it, which the grammar asks for none of`, () => {
		expect(findAddressSpans(`@import"a.css"`)).toEqual([{ start: 7, end: 14 }])
	})

	it(`an import name written in upper case or with an escape, both of which name the same at-rule`, () => {
		expect(findAddressSpans(`@IMPORT "a.css"`)).toEqual([{ start: 8, end: 15 }])
		expect(findAddressSpans(`@\\69 mport "a.css"`)).toEqual([{ start: 11, end: 18 }])
	})

	it(`a name merely opening with the six letters of an import, which names no address`, () => {
		expect(findAddressSpans(`@imports "a.css"`)).toEqual([])
		expect(findAddressSpans(`@import "a.css"`)).toEqual([{ start: 8, end: 15 }])
	})

	it(`the same six letters running into the name of a call, which is one name and opens no address either`, () => {
		expect(findAddressSpans(`@importurl(a.css)`)).toEqual([])
		expect(findAddressSpans(`@import url(a.css)`)).toEqual([{ start: 12, end: 17 }])
	})

	it(`a comment or a break between the name and the address, neither of which ends the wait for it`, () => {
		expect(findAddressSpans(`@import /* c */ "a.css"`)).toEqual([{ start: 16, end: 23 }])
		expect(findAddressSpans(`@import // c\n"a.css"`)).toEqual([{ start: 13, end: 20 }])
		expect(findAddressSpans(`@import\n"a.css"`)).toEqual([{ start: 8, end: 15 }])
	})

	it(`the same double slash in a syntax that spells no comment with one, where the wait ends on the first slash`, () => {
		expect(findAddressSpans(`@import // c\n"a.css"`, PLAIN_CSS)).toEqual([])
	})

	it(`anything else between the name and a string, which ends the wait`, () => {
		expect(findAddressSpans(`@import a "b.css"`)).toEqual([])
		expect(findAddressSpans(`@import "a.css" "b.css"`)).toEqual([{ start: 8, end: 15 }])
	})

	it(`an import naming a url, whose address is the one the parentheses hold`, () => {
		expect(findAddressSpans(`@import url("a.css")`)).toEqual([{ start: 12, end: 19 }])
	})

	it(`an import written inside a comment or a string, which names none`, () => {
		expect(findAddressSpans(`/* @import "a.css" */`)).toEqual([])
		expect(findAddressSpans(`"@import 'a.css'"`)).toEqual([])
		expect(findAddressSpans(`// @import "a.css"`)).toEqual([])
	})

	it(`a string closed by no mark, and one carrying an escaped break and so reaching past its line, neither of which is an address`, () => {
		expect(findAddressSpans(`@import "a.css`)).toEqual([])
		expect(findAddressSpans(`@import "a\\\nb.css"`)).toEqual([])
	})
})

describe(`findCommentSpanAt`, () => {
	// The comment of `1px // c\n2px`, which runs from the double slash to the break
	let spans = [{ start: 4, end: 8, isInline: true }]
	// The comment of `1px /*/ c */ 2px`, which CSS closes on the last of its slashes and `postcss-value-parser` on the first star, so the fourth to the twelfth character come back as nodes of the value (#378)
	let slashStarSlash = [{ start: 4, end: 12, isInline: false }]

	it(`a position in front of the comment`, () => {
		expect(findCommentSpanAt(3, spans)).toBeUndefined()
	})

	it(`the position the comment opens at`, () => {
		expect(findCommentSpanAt(4, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`a position inside the text of the comment`, () => {
		expect(findCommentSpanAt(6, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`the last character the comment holds, which is the position in front of the break`, () => {
		expect(findCommentSpanAt(7, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`the position of the break that closes the comment, which the comment does not hold`, () => {
		expect(findCommentSpanAt(8, spans)).toBeUndefined()
	})

	it(`a position behind the comment`, () => {
		expect(findCommentSpanAt(9, spans)).toBeUndefined()
	})

	it(`any position at all where the text holds no comment`, () => {
		expect(findCommentSpanAt(4, [])).toBeUndefined()
	})

	it(`a position behind the star a comment opening with a solidus, a star and a solidus was closed on by the value parser, which is inside the comment CSS reads`, () => {
		expect(findCommentSpanAt(8, slashStarSlash)).toEqual({ start: 4, end: 12, isInline: false })
		expect(findCommentSpanAt(11, slashStarSlash)).toEqual({ start: 4, end: 12, isInline: false })
		expect(findCommentSpanAt(12, slashStarSlash)).toBeUndefined()
	})
})

describe(`findCommentSpanHolding`, () => {
	// The comment of `1px /*/ 2PX */ 3px`, whose `2PX` the value parser hands back as a word opening at 8
	let spans = [{ start: 4, end: 14, isInline: false }]

	it(`a node opening in front of the comment`, () => {
		expect(findCommentSpanHolding(valueParser(`1px /*/ 2PX */ 3px`).nodes[0] as Node, spans)).toBeUndefined()
	})

	it(`the node the value parser makes of the comment, which opens on the comment's own first character`, () => {
		expect(findCommentSpanHolding(valueParser(`1px /*/ 2PX */ 3px`).nodes[2] as Node, spans)).toEqual({ start: 4, end: 14, isInline: false })
	})

	it(`a word the parser reads behind the star it closed the comment on, which is text of the comment`, () => {
		expect(findCommentSpanHolding(valueParser(`1px /*/ 2PX */ 3px`).nodes[4] as Node, spans)).toEqual({ start: 4, end: 14, isInline: false })
	})

	it(`a node opening behind the comment`, () => {
		expect(findCommentSpanHolding(valueParser(`1px /*/ 2PX */ 3px`).nodes[8] as Node, spans)).toBeUndefined()
	})
})

describe(`findCommentSpanTouching`, () => {
	let spans = [{ start: 4, end: 8, isInline: true }]

	it(`a node ending where the comment opens, which carries none of its text`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 1, sourceEndIndex: 4 }, spans)).toBeUndefined()
	})

	it(`a node opening outside the comment and reaching into it`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 1, sourceEndIndex: 5 }, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`a node opening outside the comment and reaching past the break that closes it`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 1, sourceEndIndex: 12 }, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`a node standing inside the comment`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 5, sourceEndIndex: 7 }, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`a node opening at the break that closes the comment`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 8, sourceEndIndex: 9 }, spans)).toBeUndefined()
	})

	it(`a node standing behind the comment`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 9, sourceEndIndex: 12 }, spans)).toBeUndefined()
	})

	it(`any node at all where the text holds no comment`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 4, sourceEndIndex: 8 }, [])).toBeUndefined()
	})

	it(`a string standing behind the star the value parser closed a comment opening with a solidus, a star and a solidus on, which is text of the comment CSS reads`, () => {
		// The `"a  a"` of `"c c" /*/ "a  a" */ "b b"`, which the parser hands back as a string opening at 10
		expect(findCommentSpanTouching({ sourceIndex: 10, sourceEndIndex: 16 }, [{ start: 6, end: 19, isInline: false }])).toEqual({ start: 6, end: 19, isInline: false })
	})
})

describe(`findStringSpans`, () => {
	it(`a string of each quotation mark, the marks included`, () => {
		expect(findStringSpans(`"a" 'b'`)).toEqual([{ start: 0, end: 3 }, { start: 4, end: 7 }])
	})

	it(`a quotation mark behind an escape, which closes nothing, and one behind an escaped backslash, which closes the string`, () => {
		expect(findStringSpans(`'a\\'b' "c\\\\" d`)).toEqual([{ start: 0, end: 6 }, { start: 7, end: 12 }])
	})

	it(`a quotation mark inside a bare address, which is a character of the address`, () => {
		expect(findStringSpans(`url(x'y) 'z'`)).toEqual([{ start: 9, end: 12 }])
	})

	it(`a quoted address, whose string is a string`, () => {
		expect(findStringSpans(`url( "x" )`)).toEqual([{ start: 5, end: 8 }])
	})

	// The tokenizer reads the parentheses as code behind a sign it glues to the name, behind its own whitespace and behind a name spelled other than the word, so a string inside them is a string, which the walk records so that a scan over the copy reads the comma inside it as text (1789637913)
	it(`a string inside the parentheses of a bare address the tokenizer reads as code, which is a string, and the address it stands in, which stays one span`, () => {
		expect(findStringSpans(`1px, 1/url(a "),b" ), 'z'`)).toEqual([{ start: 13, end: 18 }, { start: 22, end: 25 }])
		expect(findStringSpans(`1,url(a ') , b' ) 2px`)).toEqual([{ start: 8, end: 15 }])
		expect(findStringSpans(`url( a "),b" ),c`)).toEqual([{ start: 7, end: 12 }])
		expect(findStringSpans(`URL(a "),b" ),c`)).toEqual([{ start: 6, end: 11 }])
		expect(findStringSpans(`url( a "),b`)).toEqual([])
		expect(findAddressSpans(`1px, 1/url(a "),b" ), 'z'`)).toEqual([{ start: 11, end: 18 }])
	})

	it(`a quotation mark inside a comment, which opens nothing`, () => {
		expect(findStringSpans(`/* ' */ a // "\n'b'`)).toEqual([{ start: 15, end: 18 }])
		expect(findStringSpans(`a // "\n'b'`, PLAIN_CSS)).toEqual([{ start: 5, end: 10 }])
	})

	it(`a string the text never closes, which runs to its end`, () => {
		expect(findStringSpans(`a "b`)).toEqual([{ start: 2, end: 4 }])
	})
})
