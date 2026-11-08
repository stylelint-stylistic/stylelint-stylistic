import lessParser from "postcss-less"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../../../index.ts"

// A parser spelling a double slash leaves the comment in the value a rule reads, and the walk read the run inside it as code; plain CSS spells none there, so the same text is code to the core
/**
 * Fixes a text under one namespace of this rule.
 * @param configured - The rule's name in that namespace.
 * @param text - The stylesheet.
 * @param customSyntax - The parser, or nothing for plain CSS.
 * @returns What the fix left.
 */
async function fixUnder (configured: string, text: string, customSyntax?: typeof lessParser): Promise<string | undefined> {
	return (await stylelint.lint({ code: text, config: { plugins, rules: { [configured]: true }, ...(customSyntax && { customSyntax }) }, fix: true })).code
}

describe(`a run inside a double-slash comment of a value`, () => {
	let code = `a { b: c // x  y\n; }`

	it(`leaves the comment where the Less parser hands it over`, async () => {
		expect(await fixUnder(`@stylistic/less/no-multiple-whitespaces`, code, lessParser)).toBe(code)
	})

	it(`leaves the same run under Less, which hands the address on as it is`, async () => {
		expect(await fixUnder(`@stylistic/less/no-multiple-whitespaces`, `a { b: url(http://x/y  z.png) }`, lessParser)).toBe(`a { b: url(http://x/y  z.png) }`)
	})
})

// A quotation mark inside the parentheses of a lower-case `url()` is a character of the address to the tokenizer, while a compiler may read a string there
describe(`a run inside a string a compiler reads in the parentheses of a url()`, () => {
	it(`leaves an escaped string under the Less parser`, async () => {
		expect(await fixUnder(`@stylistic/less/no-multiple-whitespaces`, `a { b: url(~"c  d")  e }`, lessParser)).toBe(`a { b: url(~"c  d") e }`)
	})
})

// Less and Sass end a double-slash comment at a bare carriage return, and a run opening on it took the break away and carried the comment on over the code behind
describe(`a run behind a double-slash comment a bare carriage return closes`, () => {
	let code = `a {\n\tb: c // x\r  y\n\t\td;\n}`

	it(`leaves the break closing the comment under the Less parser`, async () => {
		expect(await fixUnder(`@stylistic/less/no-multiple-whitespaces`, code, lessParser)).toBe(code)
	})
})
