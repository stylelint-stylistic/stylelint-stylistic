import { describe, expect, it } from "vitest"

import { addEdit, applyEditsFromEnd, toIndexBeforeEdits } from "./index.js"

describe(`applyEditsFromEnd`, () => {
	it(`no edit at all`, () => {
		expect(applyEditsFromEnd(`f(1,2)`, [])).toBe(`f(1,2)`)
	})

	it(`an insertion, whose span is empty`, () => {
		expect(applyEditsFromEnd(`f(1,2)`, [{ start: 3, end: 3, text: ` ` }])).toBe(`f(1 ,2)`)
	})

	it(`a deletion, whose text is empty`, () => {
		expect(applyEditsFromEnd(`f(1 ,2)`, [{ start: 3, end: 4, text: `` }])).toBe(`f(1,2)`)
	})

	it(`a replacement of a span by a text of another length`, () => {
		expect(applyEditsFromEnd(`f(1  ,2)`, [{ start: 3, end: 5, text: ` ` }])).toBe(`f(1 ,2)`)
	})

	it(`two edits given from the end backwards`, () => {
		expect(applyEditsFromEnd(`f(1,2,3)`, [
			{ start: 5, end: 5, text: ` ` },
			{ start: 3, end: 3, text: ` ` },
		])).toBe(`f(1 ,2 ,3)`)
	})

	it(`the same two edits given from the start forwards, which the sorting is what makes no difference to`, () => {
		expect(applyEditsFromEnd(`f(1,2,3)`, [
			{ start: 3, end: 3, text: ` ` },
			{ start: 5, end: 5, text: ` ` },
		])).toBe(`f(1 ,2 ,3)`)
	})

	it(`an edit in front of another that lengthens the text, whose index the second is measured before`, () => {
		expect(applyEditsFromEnd(`f(1,2,3)`, [
			{ start: 3, end: 3, text: `\n\n\n` },
			{ start: 5, end: 5, text: `\n` },
		])).toBe(`f(1\n\n\n,2\n,3)`)
	})

	it(`an edit in front of another that shortens the text`, () => {
		expect(applyEditsFromEnd(`f(1   ,2   ,3)`, [
			{ start: 3, end: 6, text: `` },
			{ start: 8, end: 11, text: `` },
		])).toBe(`f(1,2,3)`)
	})

	it(`an edit standing where the text opens and one standing where it ends`, () => {
		expect(applyEditsFromEnd(`,f(1,2),`, [
			{ start: 0, end: 1, text: `x` },
			{ start: 7, end: 8, text: `y` },
		])).toBe(`xf(1,2)y`)
	})

	it(`two edits abutting, the end of one being the start of the next`, () => {
		expect(applyEditsFromEnd(`f(1 , 2)`, [
			{ start: 3, end: 4, text: `` },
			{ start: 5, end: 6, text: `` },
		])).toBe(`f(1,2)`)
	})

	it(`four edits of both kinds, in the order a caller collects them`, () => {
		expect(applyEditsFromEnd(`f(1, /*a*/ /*b*/ /*c*/ 2)`, [
			{ start: 4, end: 5, text: `` },
			{ start: 10, end: 11, text: `` },
			{ start: 16, end: 17, text: `` },
			{ start: 22, end: 23, text: `` },
		])).toBe(`f(1,/*a*//*b*//*c*/2)`)
	})

	it(`a list the call leaves as it found it, since a caller may read its own edits afterwards`, () => {
		let edits = [
			{ start: 3, end: 3, text: ` ` },
			{ start: 5, end: 5, text: ` ` },
		]

		applyEditsFromEnd(`f(1,2,3)`, edits)

		expect(edits.map(({ start }) => start)).toStrictEqual([3, 5])
	})
})

describe(`addEdit`, () => {
	it(`an edit on a span no other edit stands on`, () => {
		let edits = [{ start: 3, end: 3, text: ` ` }]

		addEdit(edits, { start: 5, end: 5, text: `\n` })

		expect(edits).toStrictEqual([
			{ start: 3, end: 3, text: ` ` },
			{ start: 5, end: 5, text: `\n` },
		])
	})

	it(`a second edit on the span the first stands on, whose text is written behind the first's`, () => {
		let edits = [{ start: 2, end: 2, text: `a` }]

		addEdit(edits, { start: 2, end: 2, text: `b` })

		expect(edits).toStrictEqual([{ start: 2, end: 2, text: `ab` }])
	})

	it(`two deletions of one and the same span, which stay the one deletion the caller means`, () => {
		let edits = [{ start: 7, end: 8, text: `` }]

		addEdit(edits, { start: 7, end: 8, text: `` })

		expect(applyEditsFromEnd(`f(/*c*/ /*d*/)`, edits)).toBe(`f(/*c*//*d*/)`)
	})

	it(`an edit opening where another does and ending elsewhere, which is left standing apart rather than folded away`, () => {
		let edits = [{ start: 2, end: 2, text: `a` }]

		addEdit(edits, { start: 2, end: 3, text: `b` })

		// Such a pair is one no caller may build, and one `applyEditsFromEnd` cannot apply. Folding it would put a text somewhere neither edit named and leave a caller reading its own value wrongly with nothing to show for it, so the two are left as they were.
		expect(edits).toStrictEqual([
			{ start: 2, end: 2, text: `a` },
			{ start: 2, end: 3, text: `b` },
		])
	})

	it(`an edit added to an empty list`, () => {
		/** @type {import('./index.js').Edit[]} */
		let edits = []

		addEdit(edits, { start: 0, end: 1, text: `x` })

		expect(edits).toStrictEqual([{ start: 0, end: 1, text: `x` }])
	})
})

describe(`toIndexBeforeEdits`, () => {
	// `f(1,2,3)` written as `f(1\n\n,2\n,3)`
	let edits = [{ start: 3, end: 3, text: `\n\n` }, { start: 5, end: 5, text: `\n` }]

	it(`no edit at all, which leaves every index its own`, () => {
		expect(toIndexBeforeEdits(4, [])).toBe(4)
	})

	it(`an index in front of every edit`, () => {
		expect(toIndexBeforeEdits(2, edits)).toBe(2)
	})

	it(`the index a written run opens at`, () => {
		expect(toIndexBeforeEdits(3, edits)).toBe(3)
	})

	it(`an index inside a written run, which points at no character of the text`, () => {
		expect(toIndexBeforeEdits(4, edits)).toBe(3)
	})

	it(`the index just behind a written run`, () => {
		expect(toIndexBeforeEdits(5, edits)).toBe(3)
	})

	it(`an index between two edits`, () => {
		expect(toIndexBeforeEdits(6, edits)).toBe(4)
	})

	it(`an index behind every edit`, () => {
		expect(toIndexBeforeEdits(10, edits)).toBe(7)
	})

	it(`the end of the edited text, which is the end of the text`, () => {
		expect(toIndexBeforeEdits(11, edits)).toBe(8)
	})

	it(`the same edits given from the end backwards, which the sorting is what makes no difference to`, () => {
		expect(toIndexBeforeEdits(6, edits.toReversed())).toBe(4)
	})

	it(`a deletion, whose span the text behind it answers from the far end of`, () => {
		// `f(1   ,2)` written as `f(1,2)`
		expect(toIndexBeforeEdits(3, [{ start: 3, end: 6, text: `` }])).toBe(6)
	})

	it(`a replacement of a span by a text of another length`, () => {
		// `f(1  ,2)` written as `f(1 ,2)`
		expect(toIndexBeforeEdits(4, [{ start: 3, end: 5, text: ` ` }])).toBe(5)
	})

	it(`the end of an inline comment the fix closed with a break of its own`, () => {
		let declValue = `foo(1px // c) calc(2px)`
		// `foo(\n1px // c\n) calc(2px)`, where the comment runs from the double slash to the break written in front of the closing parenthesis
		let breaks = [{ start: 4, end: 4, text: `\n` }, { start: 12, end: 12, text: `\n` }]

		expect(declValue.slice(toIndexBeforeEdits(9, breaks), toIndexBeforeEdits(13, breaks))).toBe(`// c`)
	})
})
