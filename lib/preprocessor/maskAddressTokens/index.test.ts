import { parse } from "postcss"
import scssSyntax, { parse as parseScss } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { maskAddressTokens } from "./index.ts"

/**
 * Masks a stylesheet as its own copy, its root the node.
 * @param text - The stylesheet.
 * @returns The copy.
 */
function masked (text: string): string {
	return maskAddressTokens(text, text, parse(text))
}

describe(`maskAddressTokens`, () => {
	it(`the content of an address holding a parenthesis, its own parentheses kept`, () => {
		expect(masked(`a { b: url(x(y),c }`)).toBe(`a { b: url(???),c }`)
	})

	it(`an address inside a call, and a call behind it`, () => {
		expect(masked(`a { b: f(url(x(y(z),c),g(d) }`)).toBe(`a { b: f(url(?????),c),g(d) }`)
	})

	it(`the token the tokenizer takes behind a parenthesis standing apart from the name, masked whole`, () => {
		expect(masked(`a { b: url (a(b,c).png) }`)).toBe(`a { b: url (?????).png) }`)
	})

	it(`a name the tokenizer reads as another word or spelled otherwise, whose parentheses are plain`, () => {
		expect(masked(`a { b: URL(x(y)),1,url(x(y)),u\\rl(x(y)) }`)).toBe(`a { b: URL(x(y)),1,url(x(y)),u\\rl(x(y)) }`)
	})

	it(`whitespace behind the parenthesis, which keeps the parentheses plain to PostCSS's tokenizer`, () => {
		expect(masked(`a { b: url( x(y) ),c }`)).toBe(`a { b: url( x(y) ),c }`)
	})

	it(`no address`, () => {
		expect(masked(`a { b: f(x(y)),c }`)).toBe(`a { b: f(x(y)),c }`)
	})

	it(`an escaped parenthesis, which balances the token to the tokenizer and not in the copy, whose escapes are masked`, () => {
		let text = `a { b: url(x\\)(y),c }`

		expect(maskAddressTokens(`a { b: url(xxx(y),c }`, text, parse(text))).toBe(`a { b: url(?????),c }`)
	})

	it(`postcss-scss, which closes the address at the count of parentheses as the scan does, and whose call inside it stays one`, () => {
		let text = `a { b: url(x(y)),c }`

		expect(masked(text)).toBe(`a { b: url(???)),c }`)
		expect(maskAddressTokens(text, text, parseScss(text), { opts: { syntax: scssSyntax } } as unknown as PostcssResult)).toBe(text)
	})
})
