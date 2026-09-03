import { describe, expect, it } from "vitest"

import { hideQuotesInComments } from "./index.ts"

describe(`hideQuotesInComments`, () => {
	it(`no comment`, () => {
		expect(hideQuotesInComments(`1px "2px"`)).toBe(`1px "2px"`)
	})

	it(`a mark left open by a comment opening with a solidus, a star and a solidus, whose text the value parser reads as code`, () => {
		expect(hideQuotesInComments(`2PX /*/ " */ "2PX"`)).toBe(`2PX /*/ ? */ "2PX"`)
	})

	it(`a mark left open by an inline comment, whose break stays where it is`, () => {
		expect(hideQuotesInComments(`1px // "\n"2px"`)).toBe(`1px // ?\n"2px"`)
	})

	it(`marks of the two kinds, each left open by the same comment, which takes a pass apiece`, () => {
		expect(hideQuotesInComments(`1px /*/ "' */ "2px"`)).toBe(`1px /*/ ?? */ "2px"`)
	})

	it(`a mark inside a comment the parser closes where the file does, whose text is no code of the value`, () => {
		expect(hideQuotesInComments(`1px /*"*/ "2px"`)).toBe(`1px /*"*/ "2px"`)
	})

	it(`a pair the comment closes around itself, whose string reaches past nothing`, () => {
		expect(hideQuotesInComments(`1px /*/ ")" */ "2px"`)).toBe(`1px /*/ ")" */ "2px"`)
	})

	it(`a pair and a mark left open behind it, of which only the second is written over`, () => {
		expect(hideQuotesInComments(`1px /*/ "a" " */ "2px"`)).toBe(`1px /*/ "a" ? */ "2px"`)
	})

	it(`a mark an escape has already taken the meaning from, which opens no string`, () => {
		expect(hideQuotesInComments(`1px /*/ \\" */ "2px"`)).toBe(`1px /*/ \\" */ "2px"`)
	})

	it(`a mark whose string the comment closes on a mark an escape stands in front of, and so does not close`, () => {
		expect(hideQuotesInComments(`1px /*/ "a\\" */ "2px"`)).toBe(`1px /*/ ?a\\" */ "2px"`)
	})

	it(`a mark inside a bare address the comment holds, which is a character of one word to the parser and closes nothing`, () => {
		expect(hideQuotesInComments(`2PX /*/ url(a"b) "c" */ "2PX"`)).toBe(`2PX /*/ url(a"b) "c" */ "2PX"`)
	})

	it(`a comment running to the end of the text, which the mark it holds reaches past no further than the comment does`, () => {
		expect(hideQuotesInComments(`1px // "`)).toBe(`1px // "`)
	})

	it(`a run inside a string that spells the delimiters of a comment`, () => {
		expect(hideQuotesInComments(`"a/*b" "c*/d"`)).toBe(`"a/*b" "c*/d"`)
	})

	it(`a double slash belonging to an address`, () => {
		expect(hideQuotesInComments(`url(http://x) "2px"`)).toBe(`url(http://x) "2px"`)
	})

	it(`the copy is as long as the text`, () => {
		let text = `1px /*/ " */ , // "\n"2px"`

		expect(hideQuotesInComments(text)).toHaveLength(text.length)
	})

	it(`spans handed in rather than found`, () => {
		expect(hideQuotesInComments(`1px /*/ " */ "2px"`, [{ start: 4, end: 12, isInline: false }])).toBe(`1px /*/ ? */ "2px"`)
	})
})
