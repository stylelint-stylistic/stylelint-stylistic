import type { Comment, Container, Parser } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { inlineCommentCode } from "./index.ts"

/**
 * Reads the comment closing the one block of a stylesheet.
 * @param code - The block's content, the comment last.
 * @param syntax - The syntax the stylesheet is parsed with.
 * @returns What the util makes of that comment.
 */
function closing (code: string, syntax: { parse: Parser } = less): string | null {
	let block = syntax.parse(`a {\n\t${code}\n}`, { from: undefined }).first as Container

	return inlineCommentCode(block.last as Comment)
}

describe(`inlineCommentCode`, () => {
	it(`code behind a bare carriage return, which this syntax keeps as the text of the comment, in a copy counted from behind the double slash with the break kept`, () => {
		expect(closing(`b: c; // x\r d: e;`)).toBe(`  \r d: e;`)
		expect(closing(`b: c; // x\r;`)).toBe(`  \r;`)
	})

	it(`a break with nothing but whitespace in front of it, which this syntax keeps in the left raw, read with that raw`, () => {
		expect(closing(`b: c; // \r d: e;`)).toBe(` \r d: e;`)
		expect(closing(`b: c; //\r d: e;`)).toBe(`\r d: e;`)
	})

	it(`comments behind the break, blanked where they run, a line comment to the next break`, () => {
		expect(closing(`b: c; // x\r; // d;`)).toBe(`  \r;      `)
		expect(closing(`b: c; // x\r /* d; */ ;`)).toBe(`  \r          ;`)
		expect(closing(`b: c; // x\r // d;\r;`)).toBe(`  \r      \r;`)
	})

	it(`nothing but whitespace or comments behind the break, a line feed closing the comment, and a form feed, which Less reads as the text of the comment`, () => {
		expect(closing(`b: c; // x\r // d`)).toBeNull()
		expect(closing(`b: c; // \r\n\t`)).toBeNull()
		expect(closing(`b: c; // x\f d: e;`)).toBeNull()
	})

	it(`a block comment holding a carriage return, and an inline comment the SCSS parser ends on it`, () => {
		expect(closing(`b: c; /* x\r d: e; */`)).toBeNull()
		expect(closing(`b: c; d: e; // x\r`, scss)).toBeNull()
	})
})
