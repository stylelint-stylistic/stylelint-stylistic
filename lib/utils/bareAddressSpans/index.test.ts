import { describe, expect, it } from "vitest"

import { bareAddressSpans } from "./index.ts"

describe(`bareAddressSpans`, () => {
	it(`a bare address, from its opening parenthesis to behind its closing one`, () => {
		expect(bareAddressSpans(`url(a b) 1px`)).toEqual([{ start: 3, end: 8 }])
	})

	it(`a quoted address, which is a call to the compilers`, () => {
		expect(bareAddressSpans(`url("a b") url( 'c' )`)).toEqual([])
	})

	it(`a name a character joins, which opens a call`, () => {
		expect(bareAddressSpans(`#url(c) 1url(d) url1(e)`)).toEqual([])
	})

	it(`a name in upper case, which the compilers read as an address too`, () => {
		expect(bareAddressSpans(`URL(a b)`)).toEqual([{ start: 3, end: 8 }])
	})

	it(`a name an escape closes in front of, which is a character of a longer name`, () => {
		expect(bareAddressSpans(`\\61 url(a b)`)).toEqual([])
	})

	it(`an escaped closing parenthesis, which is a character of the address`, () => {
		expect(bareAddressSpans(`url(a\\)b) c`)).toEqual([{ start: 3, end: 9 }])
	})

	it(`an address nothing closes, which runs to the end of the text`, () => {
		expect(bareAddressSpans(`url(a b`)).toEqual([{ start: 3, end: 7 }])
	})

	it(`an address holding an interpolation, which is code to Sass and left out`, () => {
		expect(bareAddressSpans(`url(a#{$b  c}d) e`)).toEqual([{ start: 3, end: 5 }, { start: 13, end: 15 }])
		expect(bareAddressSpans(`url(#{$a})`)).toEqual([{ start: 3, end: 4 }, { start: 9, end: 10 }])
	})

	it(`two addresses, each its own span`, () => {
		expect(bareAddressSpans(`url(a) url(b)`)).toEqual([{ start: 3, end: 6 }, { start: 10, end: 13 }])
	})
})
