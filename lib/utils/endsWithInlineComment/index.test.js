import { describe, expect, it } from "vitest"

import { endsWithInlineComment } from "./index.js"

/** The reading Less has, which leaves such a comment standing in the value a rule reads. */
const LESS = { spells: true, keeps: true }

/** The reading plain CSS has, which spells no comment with a double slash at all. */
const PLAIN_CSS = { spells: false, keeps: false }

describe(`endsWithInlineComment`, () => {
	it(`empty string`, () => {
		expect(endsWithInlineComment(``)).toBe(false)
	})

	it(`whitespace only`, () => {
		expect(endsWithInlineComment(` \n\t`)).toBe(false)
	})

	it(`inline comment`, () => {
		expect(endsWithInlineComment(` // keep me`)).toBe(true)
	})

	it(`inline comment closed by a line break`, () => {
		expect(endsWithInlineComment(` // keep me\n`)).toBe(true)
	})

	it(`inline comment closed by a CRLF and an indent`, () => {
		expect(endsWithInlineComment(` // keep me\r\n\t`)).toBe(true)
	})

	it(`inline comment followed by content`, () => {
		expect(endsWithInlineComment(` // keep me\ncolor`)).toBe(false)
	})

	it(`block comment`, () => {
		expect(endsWithInlineComment(` /* keep me */\n`)).toBe(false)
	})

	it(`block comment holding a double slash`, () => {
		expect(endsWithInlineComment(` /* keep // me */\n`)).toBe(false)
	})

	it(`block comment holding an URL`, () => {
		expect(endsWithInlineComment(` /* https://foo.bar/ */\n`)).toBe(false)
	})

	it(`block comment spanning several lines`, () => {
		expect(endsWithInlineComment(` /*\n// keep me\n*/\n`)).toBe(false)
	})

	it(`inline comment after a block comment`, () => {
		expect(endsWithInlineComment(` /* one */ // two\n`)).toBe(true)
	})

	it(`block comment after an inline comment`, () => {
		expect(endsWithInlineComment(` // one\n/* two */`)).toBe(false)
	})

	it(`several inline comments`, () => {
		expect(endsWithInlineComment(` // one\n// two\n`)).toBe(true)
	})

	it(`unquoted URL`, () => {
		expect(endsWithInlineComment(`background: url(http://foo.bar/a.png)\n`)).toBe(false)
	})

	it(`unquoted protocol-relative URL`, () => {
		expect(endsWithInlineComment(`background: url(//foo.bar/a.png)\n`)).toBe(false)
	})

	it(`quoted URL`, () => {
		expect(endsWithInlineComment(`background: url("http://foo.bar/a.png")\n`)).toBe(false)
	})

	it(`string holding a double slash`, () => {
		expect(endsWithInlineComment(`content: "//"\n`)).toBe(false)
	})

	it(`inline comment after an URL`, () => {
		expect(endsWithInlineComment(`background: url(http://foo.bar/a.png) // keep me\n`)).toBe(true)
	})

	it(`inline comment holding a quote`, () => {
		expect(endsWithInlineComment(` // it's mine\n`)).toBe(true)
	})

	it(`inline comment inside a string`, () => {
		expect(endsWithInlineComment(`content: "// not a comment"\n`)).toBe(false)
	})

	it(`a bare carriage return or a form feed inside the comment, which is whitespace and closes nothing, whatever the reading`, () => {
		expect(endsWithInlineComment(` // one\rcolor`)).toBe(true)
		expect(endsWithInlineComment(` // one\fcolor`)).toBe(true)
		expect(endsWithInlineComment(` // one\fcolor`, LESS)).toBe(true)
		expect(endsWithInlineComment(`// A \f " \n B " // C "`)).toBe(false)
	})

	it(`inline comment a carriage return leaves at the end`, () => {
		expect(endsWithInlineComment(` // one\r`)).toBe(true)
	})

	it(`escaped quote inside a string`, () => {
		expect(endsWithInlineComment(`content: "\\"" // keep me\n`)).toBe(true)
	})

	it(`a syntax spelling no comment with a double slash ends in code, whatever the text holds`, () => {
		expect(endsWithInlineComment(` // keep me`, PLAIN_CSS)).toBe(false)
		expect(endsWithInlineComment(`1px//c`, PLAIN_CSS)).toBe(false)
		expect(endsWithInlineComment(`myurl(//a)`, PLAIN_CSS)).toBe(false)
	})

	it(`a text ending in an unclosed comment of the other kind is no inline comment either`, () => {
		expect(endsWithInlineComment(`1px /* c`)).toBe(false)
	})
})
