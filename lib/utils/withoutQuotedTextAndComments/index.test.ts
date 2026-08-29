import { describe, expect, it } from "vitest"

import { withoutQuotedTextAndComments } from "./index.ts"

describe(`withoutQuotedTextAndComments`, () => {
	it(`a selector holding neither`, () => {
		expect(withoutQuotedTextAndComments(`.a .b`)).toBe(`.a .b`)
	})
	it(`a quoted run, whose quotes stay where they are`, () => {
		expect(withoutQuotedTextAndComments(`[title=":extend(x)"]`)).toBe(`[title="          "]`)
		expect(withoutQuotedTextAndComments(`[title='a b']`)).toBe(`[title='   ']`)
	})
	it(`a comment, which goes with its delimiters`, () => {
		expect(withoutQuotedTextAndComments(`a /* // */ b`)).toBe(`a          b`)
		expect(withoutQuotedTextAndComments(`a/*one*//*two*/b`)).toBe(`a              b`)
	})
	it(`an escaped quotation mark, which opens no string`, () => {
		expect(withoutQuotedTextAndComments(String.raw`.x\'y:hover when ('z' = 'w')`)).toBe(String.raw`.x\'y:hover when (' ' = ' ')`)
	})
	it(`a quoted run spanning more than one line`, () => {
		expect(withoutQuotedTextAndComments(`a[href="x\\\n when (y)"]`)).toBe(`a[href="            "]`)
	})
})
