import { describe, expect, it } from "vitest"

import { readAddress } from "./index.ts"

describe(`readAddress`, () => {
	it(`a bare address, which the first parenthesis behind it closes`, () => {
		expect(readAddress(`url(a.png) 1px`, 4)).toEqual({ isQuoted: false, index: 9 })
		expect(readAddress(`url(http://a/b.png)`, 4)).toEqual({ isQuoted: false, index: 18 })
		expect(readAddress(`url()`, 4)).toEqual({ isQuoted: false, index: 4 })
	})

	it(`a parenthesis written inside a bare address, which closes it as the one behind it would`, () => {
		expect(readAddress(`url(a(b)c//d) 1px`, 4)).toEqual({ isQuoted: false, index: 7 })
	})

	it(`a parenthesis an escape holds, which closes nothing`, () => {
		expect(readAddress(`url(a\\)b) 1px`, 4)).toEqual({ isQuoted: false, index: 8 })
		expect(readAddress(`url(a\\\\)b) 1px`, 4)).toEqual({ isQuoted: false, index: 7 })
	})

	it(`a bare address the text closes with no parenthesis at all, which runs to its end`, () => {
		expect(readAddress(`url(a.png`, 4)).toEqual({ isQuoted: false, index: 9 })
		expect(readAddress(`url(a\\`, 4)).toEqual({ isQuoted: false, index: 6 })
	})

	it(`a quotation mark of either kind behind the parenthesis, which makes the address the string's and the rest of the parentheses code`, () => {
		expect(readAddress(`url("a" // c)`, 4)).toEqual({ isQuoted: true, index: 4 })
		expect(readAddress(`url('a')`, 4)).toEqual({ isQuoted: true, index: 4 })
	})

	it(`whitespace between the parenthesis and the mark, which parts them for postcss-scss alone`, () => {
		expect(readAddress(`url( "a" // c)`, 4)).toEqual({ isQuoted: true, index: 5 })
		expect(readAddress(`url(\n\t"a.png"\n)`, 4)).toEqual({ isQuoted: true, index: 6 })
	})

	// None of the three is whitespace to any of the tokenizers; Sass reads the comment behind the no-break space and behind the line separator, and refuses a file holding the vertical tab at all, so the wider reading is the declining one. See #557
	it(`whitespace no tokenizer reads as whitespace between the parenthesis and the mark, which parts them all the same`, () => {
		expect(readAddress(`url(\u00A0"a" // c)`, 4)).toEqual({ isQuoted: true, index: 5 })
		expect(readAddress(`url(\v"a" // c)`, 4)).toEqual({ isQuoted: true, index: 5 })
		expect(readAddress(`url(\u2028"a" // c)`, 4)).toEqual({ isQuoted: true, index: 5 })
	})

	it(`a quotation mark standing deeper inside a bare address, which opens no string`, () => {
		expect(readAddress(`url(a"b.png)`, 4)).toEqual({ isQuoted: false, index: 11 })
		expect(readAddress(`url( a"b.png )`, 4)).toEqual({ isQuoted: false, index: 13 })
	})
})
