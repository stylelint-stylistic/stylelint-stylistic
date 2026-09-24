import type { AtRule } from "postcss"
import less from "postcss-less"
import { describe, expect, it } from "vitest"

import { readsWhitespaceBehindAtRuleName } from "./index.ts"

/**
 * Asks about the first at-rule of a stylesheet.
 * @param code - The stylesheet, opening on the at-rule.
 * @returns What the util makes of that at-rule.
 */
function reads (code: string): boolean {
	let atRule = less.parse(code, { from: undefined }).first as AtRule

	return readsWhitespaceBehindAtRuleName(atRule)
}

describe(`readsWhitespaceBehindAtRuleName`, () => {
	it(`an import and a plugin with nothing but code or a comment behind the name, which Less prints through as text`, () => {
		expect(reads(`@import(reference) "x.less";`)).toBe(true)
		expect(reads(`@import"x.less";`)).toBe(true)
		expect(reads(`@import'x.less';`)).toBe(true)
		expect(reads(`@import/* c */"x.less";`)).toBe(true)
		expect(reads(`@plugin(args) "p";`)).toBe(true)
		expect(reads(`@plugin"p";`)).toBe(true)
	})

	it(`the same at-rules with a space, a tab, a line break or a form feed behind the name, which Less reads as directives`, () => {
		for (let whitespace of [` `, `\t`, `\n`, `\r`, `\r\n`, `\f`]) {
			expect(reads(`@import${whitespace}"x.less";`)).toBe(false)
			expect(reads(`@plugin${whitespace}"p";`)).toBe(false)
		}
	})

	it(`a vertical tab and a no-break space behind the name, which the parser reads into the name and Less as whitespace`, () => {
		expect(reads(`@import\v"x.less";`)).toBe(false)
		expect(reads(`@import\u00A0"x.less";`)).toBe(false)
	})

	it(`an upper-case name, which Less refuses in both spellings and at-rule-name-case may lowercase within the same run`, () => {
		expect(reads(`@IMPORT(reference) "x.less";`)).toBe(true)
		expect(reads(`@Plugin"p";`)).toBe(true)
	})

	it(`at-rules Less reads the same in both spellings`, () => {
		expect(reads(`@media(min-width: 1px) { }`)).toBe(false)
		expect(reads(`@layer(l);`)).toBe(false)
		expect(reads(`@namespace"x";`)).toBe(false)
	})
})
