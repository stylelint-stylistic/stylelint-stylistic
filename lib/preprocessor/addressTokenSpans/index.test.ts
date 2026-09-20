import scssSyntax from "postcss-scss"
import { describe, expect, it } from "vitest"

import { addressTokenSpans } from "./index.ts"

describe(`addressTokenSpans`, () => {
	it(`the parentheses a tokenizer takes as one token behind the word url, whatever parts the name from them`, () => {
		expect(addressTokenSpans(``, `url (a "),b)`)).toEqual([{ start: 4, end: 9 }])
		expect(addressTokenSpans(``, `url\t(a "),b)`)).toEqual([{ start: 4, end: 9 }])
		expect(addressTokenSpans(``, `url\n(a "),b)`)).toEqual([{ start: 4, end: 9 }])
		expect(addressTokenSpans(``, `url/*c*/(a "),b)`)).toEqual([{ start: 8, end: 13 }])
		expect(addressTokenSpans(``, `url(a "),b)`)).toEqual([{ start: 3, end: 8 }])
	})

	it(`a name the tokenizer reads as one longer word, and one spelled otherwise, which leave the parentheses code`, () => {
		expect(addressTokenSpans(``, `aurl (a "),b)`)).toEqual([])
		expect(addressTokenSpans(``, `1/url (a "),b)`)).toEqual([])
		expect(addressTokenSpans(``, `URL (a "),b)`)).toEqual([])
	})

	it(`a quotation mark right behind the parenthesis, which keeps the parentheses code to PostCSS's tokenizer, and whitespace, which keeps them code to it alone`, () => {
		expect(addressTokenSpans(``, `url ("a")`)).toEqual([])
		expect(addressTokenSpans(``, `url ( a "),b )`)).toEqual([])
		expect(addressTokenSpans(``, `url ( a "),b )`, scssSyntax)).toEqual([{ start: 4, end: 10 }])
	})

	it(`the close, which PostCSS reads at the first parenthesis no backslash escapes and postcss-scss at the count of parentheses`, () => {
		expect(addressTokenSpans(``, `url (a "(),b))`)).toEqual([{ start: 4, end: 10 }])
		expect(addressTokenSpans(``, `url (a "(),b))`, scssSyntax)).toEqual([{ start: 4, end: 13 }])
	})

	it(`the text in front, which carries the word the parenthesis pops and is answered for by no span`, () => {
		expect(addressTokenSpans(`url: `, `(a "),b)`)).toEqual([{ start: 0, end: 5 }])
		expect(addressTokenSpans(`b: `, `(a "),b)`)).toEqual([])
		expect(addressTokenSpans(`url (a "),b) `, `c`)).toEqual([])
	})

	it(`a text holding no quotation mark, which no span of this is asked about`, () => {
		expect(addressTokenSpans(``, `url (a,b)`)).toEqual([])
	})
})
