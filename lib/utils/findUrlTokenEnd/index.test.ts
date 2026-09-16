import { describe, expect, it } from "vitest"

import { findUrlTokenEnd } from "./index.ts"

const SCSS = { spells: true, tokenizes: true, endsOnFormFeed: true }

describe(`findUrlTokenEnd`, () => {
	it(`parentheses holding no parenthesis, at the text's start and behind whitespace`, () => {
		expect(findUrlTokenEnd(`url( a\\// c ) 1px`, 0, -1, SCSS)).toBe(13)
		expect(findUrlTokenEnd(`1px url(a) 2px`, 4, 3, SCSS)).toBe(10)
	})

	it(`parentheses holding a pair of their own, which the tokenizer counts`, () => {
		expect(findUrlTokenEnd(`url( a( b ) \\//c ) 1px`, 0, -1, SCSS)).toBe(18)
	})

	it(`a parenthesis behind a backslash and one inside a comment or a string, which the tokenizer counts all the same`, () => {
		expect(findUrlTokenEnd(`url( a\\) \\//c )`, 0, -1, SCSS)).toBe(8)
		expect(findUrlTokenEnd(`url( /* ) */ \\//c )`, 0, -1, SCSS)).toBe(9)
		expect(findUrlTokenEnd(`url( a ")" \\//c )`, 0, -1, SCSS)).toBe(9)
	})

	it(`parentheses nothing closes, which run to the text's end`, () => {
		expect(findUrlTokenEnd(`url( a( b ) \\//c`, 0, -1, SCSS)).toBe(16)
	})

	it(`a quotation mark against the parenthesis, where the tokenizer opens no such token`, () => {
		expect(findUrlTokenEnd(`url("a" \\//c)`, 0, -1, SCSS)).toBe(0)
		expect(findUrlTokenEnd(`url('a' \\//c)`, 0, -1, SCSS)).toBe(0)
	})

	// The tokenizer takes this one as a token, but a fix taking the whitespace away puts the mark against the parenthesis and turns the double slash into a comment
	it(`a quotation mark behind whitespace, read as opening no token either`, () => {
		expect(findUrlTokenEnd(`url( "a" \\//c )`, 0, -1, SCSS)).toBe(0)
	})

	it(`a word other than the lower-case one, and the word apart from its parenthesis`, () => {
		expect(findUrlTokenEnd(`URL(a\\//c)`, 0, -1, SCSS)).toBe(0)
		expect(findUrlTokenEnd(`urls(a\\//c)`, 0, -1, SCSS)).toBe(0)
		expect(findUrlTokenEnd(`url (a\\//c)`, 0, -1, SCSS)).toBe(0)
	})

	it(`the word behind an escape, an interpolation, a comma and a parenthesis, each of which ends a token`, () => {
		expect(findUrlTokenEnd(`\\61 url(a\\//c)`, 4, 0, SCSS)).toBe(14)
		expect(findUrlTokenEnd(`#{$p}url(a\\//c)`, 5, 4, SCSS)).toBe(15)
		expect(findUrlTokenEnd(`1,url(a\\//c)`, 2, 1, SCSS)).toBe(12)
		expect(findUrlTokenEnd(`a(url(b\\//c))`, 2, 1, SCSS)).toBe(12)
	})

	it(`the same parentheses under a parser whose own tokenizer reads no double-slash comment, where nothing asks for the token`, () => {
		expect(findUrlTokenEnd(`url( a( b ) \\//c ) 1px`, 0, -1, { spells: true, tokenizes: false, endsOnFormFeed: false })).toBe(0)
	})

	it(`the word behind a letter and behind an escaped solidus, which the tokenizer reads into one word with it`, () => {
		expect(findUrlTokenEnd(`aurl(a\\//c)`, 1, 0, SCSS)).toBe(1)
		expect(findUrlTokenEnd(`\\/url(a\\//c)`, 2, 0, SCSS)).toBe(2)
	})
})
