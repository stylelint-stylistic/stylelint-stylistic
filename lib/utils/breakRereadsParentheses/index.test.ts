import { describe, expect, it } from "vitest"

import { breakAtRereadsParentheses, breakRereadsParentheses } from "./index.ts"

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
		expect(breakAtRereadsParentheses(`1 (a,[b) 2px`, 4, false)).toBe(true)
		expect(breakAtRereadsParentheses(`1 (a[b,c) 2px`, 6, false)).toBe(true)
		expect(breakAtRereadsParentheses(`--b: (a,{b)`, 7, true)).toBe(true)
		expect(breakAtRereadsParentheses(`1 (a,{b) 2px`, 4, false)).toBe(false)
	})

	it(`an index behind the parentheses, whose first \`)\` stands in front of it`, () => {
		expect(breakAtRereadsParentheses(`(a[b) 1,2`, 7, false)).toBe(false)
	})

	it(`an index in front of every parenthesis`, () => {
		expect(breakAtRereadsParentheses(`1,2 (a[b)`, 1, false)).toBe(false)
	})

	it(`an index inside a nested pair, which the tokenizer holds while the outer one is code`, () => {
		expect(breakAtRereadsParentheses(`f(1, (a,[b))`, 7, false)).toBe(true)
		expect(breakAtRereadsParentheses(`f(1, (a,[b)) ,c`, 13, false)).toBe(false)
	})
})
