import { describe, expect, it } from "vitest"

import { breakAtRereadsParentheses, breakRereadsParentheses } from "./index.ts"

let POSTCSS = { tokenizes: false }
let SCSS = { tokenizes: true }

describe(`breakRereadsParentheses`, () => {
	it(`a square bracket nothing closes inside one token, alone, behind a comma and in front of one`, () => {
		expect(breakRereadsParentheses(`1 f(a[b) 2px`, 3, false)).toBe(true)
		expect(breakRereadsParentheses(`1 f(a,[b) 2px`, 3, false)).toBe(true)
		expect(breakRereadsParentheses(`1 f(a[b,c) 2px`, 3, false)).toBe(true)
		expect(breakRereadsParentheses(`1 f(a]b[c) 2px`, 3, false)).toBe(true)
	})

	it(`a square bracket closed inside the token, and a closing one alone, which the parser passes over`, () => {
		expect(breakRereadsParentheses(`1 f(a[b]) 2px`, 3, false)).toBe(false)
		expect(breakRereadsParentheses(`1 f(a]b) 2px`, 3, false)).toBe(false)
	})

	it(`a brace nothing closes, which opens a group in a custom property's value alone`, () => {
		expect(breakRereadsParentheses(`f(a{b)`, 1, true)).toBe(true)
		expect(breakRereadsParentheses(`f(a{b;c)`, 1, true)).toBe(true)
		expect(breakRereadsParentheses(`f(a{b})`, 1, true)).toBe(false)
		expect(breakRereadsParentheses(`f(a{b)`, 1, false)).toBe(false)
	})

	it(`parentheses the tokenizer reads as code already, on a break, a quotation mark, an opening parenthesis, a solidus or a backslash, whose bracket the file left open`, () => {
		expect(breakRereadsParentheses(`f(a\n[b)`, 1, false)).toBe(false)
		expect(breakRereadsParentheses(`f("a"[b)`, 1, false)).toBe(false)
		expect(breakRereadsParentheses(`f(g(a)[b)`, 1, false)).toBe(false)
		expect(breakRereadsParentheses(`f(a/b[c)`, 1, false)).toBe(false)
		expect(breakRereadsParentheses(`f(a\\[b)`, 1, false)).toBe(false)
	})

	it(`parentheses nothing closes`, () => {
		expect(breakRereadsParentheses(`f(a[b`, 1, false)).toBe(false)
	})

	it(`the other characters the parentheses may hold, which open no group`, () => {
		expect(breakRereadsParentheses(`f(a;b)`, 1, false)).toBe(false)
		expect(breakRereadsParentheses(`f(a}b)`, 1, true)).toBe(false)
		expect(breakRereadsParentheses(`f(a:b!c@d#e,f)`, 1, false)).toBe(false)
	})
})

describe(`breakAtRereadsParentheses`, () => {
	it(`an index inside the token, beside a comma and inside the bracket`, () => {
		expect(breakAtRereadsParentheses(`1 (a,[b) 2px`, 4, false, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(`1 (a[b,c) 2px`, 6, false, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(`--b: (a,{b)`, 7, true, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(`1 (a,{b) 2px`, 4, false, POSTCSS)).toBe(false)
	})

	it(`an index behind the parentheses, whose first \`)\` stands in front of it`, () => {
		expect(breakAtRereadsParentheses(`(a[b) 1,2`, 7, false, POSTCSS)).toBe(false)
	})

	it(`an index in front of every parenthesis`, () => {
		expect(breakAtRereadsParentheses(`1,2 (a[b)`, 1, false, POSTCSS)).toBe(false)
	})

	it(`an index inside a nested pair, which the tokenizer holds while the outer one is code`, () => {
		expect(breakAtRereadsParentheses(`f(1, (a,[b))`, 7, false, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(`f(1, (a,[b)) ,c`, 13, false, POSTCSS)).toBe(false)
	})

	it(`an index inside an address's token, which a break leaves one token closing at the same parenthesis`, () => {
		expect(breakAtRereadsParentheses(`1, url (b[c,d) g`, 11, false, POSTCSS)).toBe(false)
		expect(breakAtRereadsParentheses(`1, url (b[c,d) g`, 11, false, POSTCSS)).toBe(false)
		expect(breakAtRereadsParentheses(`1, url (b[c,d) g`, 11, false, SCSS)).toBe(false)
		expect(breakAtRereadsParentheses(`1 /*x*/url (b[c,d) g`, 15, false, POSTCSS)).toBe(false)
		expect(breakAtRereadsParentheses(`url a ((b[c,d))(b)`, 11, false, POSTCSS)).toBe(false)
	})

	it(`a name the tokenizer does not pop as the word url, which opens no address, and parentheses behind an address's token`, () => {
		expect(breakAtRereadsParentheses(`1, URL (b[c,d) g`, 11, false, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(String.raw`1, u\72l (b[c,d) g`, 13, false, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(`1 url a (b[c,d) g`, 12, false, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(`url (a) (b[c,d)`, 12, false, POSTCSS)).toBe(true)
	})

	it(`a name joined to a comma, which is one word to PostCSS's tokenizer and two tokens to postcss-scss's`, () => {
		expect(breakAtRereadsParentheses(`1 a,url (b[c,d) g`, 12, false, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(`1 a,url (b[c,d) g`, 12, false, SCSS)).toBe(false)
	})

	it(`whitespace behind the opening parenthesis, which keeps the parentheses code under PostCSS's tokenizer alone`, () => {
		expect(breakAtRereadsParentheses(`url ( b[c,d)`, 9, false, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(`url ( b[c,d)`, 9, false, SCSS)).toBe(false)
	})

	it(`a comma right behind an address's opening parenthesis, where whitespace written in front of it keeps the parentheses code under PostCSS's tokenizer, whichever rule writes it`, () => {
		expect(breakAtRereadsParentheses(`url (,b[c)`, 5, false, POSTCSS)).toBe(true)
		expect(breakAtRereadsParentheses(`url (,b[c)`, 5, false, SCSS)).toBe(false)
		expect(breakAtRereadsParentheses(`url (a,b[c)`, 6, false, POSTCSS)).toBe(false)
	})
})
