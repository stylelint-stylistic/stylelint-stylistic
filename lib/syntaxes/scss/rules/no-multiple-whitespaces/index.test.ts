import scssParser from "postcss-scss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../../../vitest.helpers.ts"
import plugins from "../../../../index.ts"

// The expression of an interpolation is read only under the parser whose tokenizer reads one, and the escapes standing in it have to be recorded: otherwise the write takes the character a backslash covers for whitespace of the run
describe(`a run behind an escape inside an interpolation of a bare address`, () => {
	let scssRule = `@stylistic/scss/no-multiple-whitespaces`

	/**
	 * Fixes a text under this rule in the SCSS namespace, whose parser is the one that reads an interpolation.
	 * @param code - The text.
	 * @returns What the fix left and what a check of it says.
	 */
	async function fix (code: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [scssRule]: true }, customSyntax: scssParser }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`keeps the escaped tab and collapses the run behind it`, async () => {
		expect(await fix(`a { b: url(c#{d\\\t  e}f) }`)).toEqual({ fixed: `a { b: url(c#{d\\\t e}f) }`, left: [] })
	})

	it(`leaves the text where the escape covers the first of two spaces`, async () => {
		expect(await fix(`a { b: url(c#{d\\  e}f) }`)).toEqual({ fixed: `a { b: url(c#{d\\  e}f) }`, left: [] })
	})

	it(`leaves the space closing a hexadecimal escape out of the run`, async () => {
		expect(await fix(`a { b: url(c#{d\\2c  e}f) }`)).toEqual({ fixed: `a { b: url(c#{d\\2c  e}f) }`, left: [] })
	})

	it(`reads the run inside the expression where no escape covers it`, async () => {
		expect(await fix(`a { b: url(c#{d  e}f) }`)).toEqual({ fixed: `a { b: url(c#{d e}f) }`, left: [] })
	})
})

// A parser spelling a double slash leaves the comment in the value a rule reads, and the walk read the run inside it as code; plain CSS spells none there, so the same text is code to the core
/**
 * Fixes a text under one namespace of this rule.
 * @param configured - The rule's name in that namespace.
 * @param text - The stylesheet.
 * @param customSyntax - The parser, or nothing for plain CSS.
 * @returns What the fix left.
 */
async function fixUnder (configured: string, text: string, customSyntax?: typeof scssParser): Promise<string | undefined> {
	return (await stylelint.lint({ code: text, config: { plugins, rules: { [configured]: true }, ...(customSyntax && { customSyntax }) }, fix: true })).code
}

describe(`a run inside a double-slash comment of a value`, () => {
	let code = `a { b: c // x  y\n; }`

	it(`leaves the comment where the SCSS parser hands it over`, async () => {
		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, code, scssParser)).toBe(code)
	})

	it(`leaves the run behind the double slash of an address Sass reads as code`, async () => {
		let address = `a { b: url(http://x/y  z.png) }`

		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, address, scssParser)).toBe(address)
	})
})

// A quotation mark inside the parentheses of a lower-case `url()` is a character of the address to the tokenizer, while a compiler may read a string there
describe(`a run inside a string a compiler reads in the parentheses of a url()`, () => {
	let code = `a { b: url(c"d  e")  f }`

	it(`leaves the string and collapses the run behind it under the SCSS parser`, async () => {
		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, code, scssParser)).toBe(`a { b: url(c"d  e") f }`)
	})

	it(`leaves a string inside an interpolation under the SCSS parser`, async () => {
		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, `a { b: url(c#{"d  e"})  f }`, scssParser)).toBe(`a { b: url(c#{"d  e"}) f }`)
	})
})

// Less and Sass end a double-slash comment at a bare carriage return, and a run opening on it took the break away and carried the comment on over the code behind
describe(`a run behind a double-slash comment a bare carriage return closes`, () => {
	let code = `a {\n\tb: c // x\r  y\n\t\td;\n}`

	it(`leaves the break closing the comment under the SCSS parser`, async () => {
		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, code, scssParser)).toBe(code)
	})
})
