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

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/321
	// Every case below stands on an escape, which the scan used to read as an ordinary character everywhere but inside an address and inside a quoted string.
	it(`a double slash whose first character an escape spells`, () => {
		expect(findCommentSpans(`a\\//b 1px`)).toEqual([])
	})

	it(`a slash an escape spells in front of a star`, () => {
		expect(findCommentSpans(`a\\/*c*/ 1px`)).toEqual([])
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

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/343
	// The cases below stand on a name the scan used to read in ASCII word characters alone, so that a call named otherwise came out an address. The last two pin what had to survive the widening, and so does the second half of the case that puts one name in two spellings: an escape opened a name whatever it spelled, so the file that writes the name `\e9 url(` reached a call on either side of the branch where the file that writes it as the character it spells did not.
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

	it(`a comment a carriage return closes`, () => {
		expect(findCommentSpans(`1px // c\r2px`)).toEqual([{ start: 4, end: 8, isInline: true }])
	})

	it(`a comment a form feed closes, where the syntax reads a line in one`, () => {
		expect(findCommentSpans(`1px // c\f2px`, true)).toEqual([{ start: 4, end: 8, isInline: true }])
	})

	it(`a form feed closes no comment where nothing is said`, () => {
		expect(findCommentSpans(`1px // c\f2px`)).toEqual([{ start: 4, end: 12, isInline: true }])
	})

	it(`a syntax spelling no comment with a double slash has none of that kind to find`, () => {
		expect(findCommentSpans(`1px // c\n2px`, false, false)).toEqual([])
		expect(findCommentSpans(`myurl(//a)`, false, false)).toEqual([])
	})

	it(`the second slash of such a syntax opens a block comment where a star follows it`, () => {
		expect(findCommentSpans(`1px//*c*/`, false, false)).toEqual([{ start: 4, end: 9, isInline: false }])
	})

	it(`a block comment of such a syntax is found as it always was`, () => {
		expect(findCommentSpans(`1px /* c */ 2px`, false, false)).toEqual([{ start: 4, end: 11, isInline: false }])
	})
})
