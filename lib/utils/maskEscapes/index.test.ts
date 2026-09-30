import { describe, expect, it } from "vitest"

import { findEscapeSpans } from "../findCommentSpans/index.ts"

import { escapeClosesOnWrittenSpace, escapeHeadLength, hexadecimalTerminatorAtHead, maskEscapes } from "./index.ts"

/** `postcss-scss`, whose own tokenizer reads a `//` comment, so the parentheses of an address are read as Sass reads them, interpolations and all. */
const SCSS = { spells: true, tokenizes: true, endsOnFormFeed: true }

describe(`maskEscapes`, () => {
	it(`no escape`, () => {
		expect(maskEscapes(`1,a b`, [])).toBe(`1,a b`)
	})

	it(`an escaped comma, and an escaped space in front of a comma`, () => {
		expect(maskEscapes(`1,a\\,b`, findEscapeSpans(`1,a\\,b`))).toBe(`1,axxb`)
		expect(maskEscapes(`1,a\\ ,b`, findEscapeSpans(`1,a\\ ,b`))).toBe(`1,axx,b`)
	})

	it(`an escaped backslash, behind which the comma stays a comma`, () => {
		expect(maskEscapes(`1,a\\\\,b`, findEscapeSpans(`1,a\\\\,b`))).toBe(`1,axx,b`)
	})

	it(`a hexadecimal escape, whose closing space, tab or form feed is written over with it`, () => {
		expect(maskEscapes(`a\\2c ,b`, findEscapeSpans(`a\\2c ,b`))).toBe(`axxxx,b`)
		expect(maskEscapes(`a\\2c\tb`, findEscapeSpans(`a\\2c\tb`))).toBe(`axxxxb`)
		expect(maskEscapes(`a\\2c\fb`, findEscapeSpans(`a\\2c\fb`))).toBe(`axxxxb`)
		expect(maskEscapes(`a\\2c,b`, findEscapeSpans(`a\\2c,b`))).toBe(`axxx,b`)
	})

	it(`a hexadecimal escape closed by a line break, which stays a break, a Windows pair whole`, () => {
		expect(maskEscapes(`a\\2c\nb`, findEscapeSpans(`a\\2c\nb`))).toBe(`axxx\nb`)
		expect(maskEscapes(`a\\2c\r\nb`, findEscapeSpans(`a\\2c\r\nb`))).toBe(`axxx\r\nb`)
	})

	it(`the whitespace closing a hexadecimal escape left as it is where asked, a break kept either way`, () => {
		expect(maskEscapes(`a\\2c ,b`, findEscapeSpans(`a\\2c ,b`), true)).toBe(`axxx ,b`)
		expect(maskEscapes(`a\\2c\t,b`, findEscapeSpans(`a\\2c\t,b`), true)).toBe(`axxx\t,b`)
		expect(maskEscapes(`a\\2c\n,b`, findEscapeSpans(`a\\2c\n,b`), true)).toBe(`axxx\n,b`)
		expect(maskEscapes(`a\\ ,b`, findEscapeSpans(`a\\ ,b`), true)).toBe(`axx,b`)
	})

	it(`a copy as long as the text`, () => {
		for (let text of [`1,a\\,b`, `a\\2c ,b`, `a\\000061 b`, `a\\2c\r\nb`, `a\\\r\nb`]) {
			expect(maskEscapes(text, findEscapeSpans(text))).toHaveLength(text.length)
		}
	})

	// An interpolation the text never closes is walked twice, by the reader of its expression and by the caller behind it, and a span recorded on both walks would splice the escape in twice
	it(`a copy as long as the text where an interpolation inside an address is never closed`, () => {
		for (let text of [`url(a#{b\\}c)`, `url(a#{b\\)`, `url(c#{d\\\t  e f)`]) {
			expect(maskEscapes(text, findEscapeSpans(text, SCSS))).toHaveLength(text.length)
		}
	})
})

describe(`escapeHeadLength`, () => {
	// Pins what an escape in front of a raw owns inside it, which the rules of the brace keep where they rewrite the raw
	it(`no escape reaching into the raw`, () => {
		expect(escapeHeadLength(`a {`, findEscapeSpans(`a {`), 1)).toBe(0)
		expect(escapeHeadLength(`a\\\\ {`, findEscapeSpans(`a\\\\ {`), 3)).toBe(0)
	})

	it(`an escaped space, whose space PostCSS files in the raw`, () => {
		expect(escapeHeadLength(`a\\ {`, findEscapeSpans(`a\\ {`), 2)).toBe(1)
		expect(escapeHeadLength(`a\\  {`, findEscapeSpans(`a\\  {`), 2)).toBe(1)
	})

	it(`a backslash in front of a line break, which is a delimiter and spells nothing`, () => {
		expect(escapeHeadLength(`a\\\n{`, findEscapeSpans(`a\\\n{`), 2)).toBe(0)
	})

	it(`a hexadecimal escape, whose closing space or tab is a character of the escape and no run; PostCSS files a tab in the raw and swallows a space, so a raw behind the space opens with no head`, () => {
		expect(escapeHeadLength(`a\\2c\t{`, findEscapeSpans(`a\\2c\t{`), 4)).toBe(1)
		expect(escapeHeadLength(`a\\2c {`, findEscapeSpans(`a\\2c {`), 4)).toBe(1)
		expect(escapeHeadLength(`a\\2c  {`, findEscapeSpans(`a\\2c  {`), 5)).toBe(0)
	})

	it(`a hexadecimal escape closed by a line break, which stays a run`, () => {
		expect(escapeHeadLength(`a\\2c\n{`, findEscapeSpans(`a\\2c\n{`), 4)).toBe(0)
	})
})

describe(`escapeClosesOnWrittenSpace`, () => {
	// Pins where a space a brace rule writes would close the escape in front of the raw rather than open the run
	it(`a hexadecimal escape ending on its digits at the raw, closed by nothing or by the break the write goes over`, () => {
		expect(escapeClosesOnWrittenSpace(`a\\2c{`, findEscapeSpans(`a\\2c{`), 4)).toBe(true)
		expect(escapeClosesOnWrittenSpace(`a\\2c\n{`, findEscapeSpans(`a\\2c\n{`), 4)).toBe(true)
	})

	it(`an escape already closed, or none`, () => {
		expect(escapeClosesOnWrittenSpace(`a\\2c {`, findEscapeSpans(`a\\2c {`), 5)).toBe(false)
		expect(escapeClosesOnWrittenSpace(`a\\ {`, findEscapeSpans(`a\\ {`), 3)).toBe(false)
		expect(escapeClosesOnWrittenSpace(`a{`, findEscapeSpans(`a{`), 1)).toBe(false)
	})
})

describe(`hexadecimalTerminatorAtHead`, () => {
	// Pins the whitespace a break written behind the head makes redundant, which is the hexadecimal escape's terminator alone
	it(`a tab, a form feed or a bare carriage return closing the escape at the head of the raw`, () => {
		expect(hexadecimalTerminatorAtHead(`a\\2c\t{`, findEscapeSpans(`a\\2c\t{`), 4)).toBe(1)
		expect(hexadecimalTerminatorAtHead(`a\\2c\f{`, findEscapeSpans(`a\\2c\f{`), 4)).toBe(1)
		expect(hexadecimalTerminatorAtHead(`a\\2c\r{`, findEscapeSpans(`a\\2c\r{`), 4)).toBe(1)
	})

	it(`a break closing it, an escaped space, or no escape at the head`, () => {
		expect(hexadecimalTerminatorAtHead(`a\\2c\n{`, findEscapeSpans(`a\\2c\n{`), 4)).toBe(0)
		expect(hexadecimalTerminatorAtHead(`a\\ {`, findEscapeSpans(`a\\ {`), 2)).toBe(0)
		expect(hexadecimalTerminatorAtHead(`a\\2c{`, findEscapeSpans(`a\\2c{`), 4)).toBe(0)
	})
})
