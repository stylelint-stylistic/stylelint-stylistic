import { parse } from "postcss"
import postcssScss, { parse as parseScss } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { takesTheOpeningLines } from "./index.ts"

describe(`takesTheOpeningLines`, () => {
	// See #682
	it(`a live copy of the rule over a file opening with an empty line`, () => {
		expect(ask(`\n;\n`, { "@stylistic/no-empty-first-line": true })).toBe(true)
		expect(ask(`\n\na {}\n`, { "@stylistic/no-empty-first-line": [true] })).toBe(true)
		expect(ask(`\n\na {}\n`, { "@stylistic/no-empty-first-line": [true, {}] })).toBe(true)
	})

	it(`no copy at all, where the configuration lists the rule under no name`, () => {
		expect(ask(`\n;\n`)).toBe(false)
		expect(ask(`\n;\n`, { "@stylistic/max-empty-lines": 1 })).toBe(false)
	})

	it(`a copy whose fix is off, which writes nothing and so takes nothing`, () => {
		expect(ask(`\n;\n`, { "@stylistic/no-empty-first-line": [true, { disableFix: true }] })).toBe(false)
	})

	it(`a copy under the namespace of another syntax, which reads a plain CSS file too`, () => {
		expect(ask(`\n;\n`, { "@stylistic/scss/no-empty-first-line": true })).toBe(true)
		expect(ask(`\n;\n`, { "@stylistic/less/no-empty-first-line": [true, { disableFix: true }], "@stylistic/scss/no-empty-first-line": true })).toBe(true)
	})

	it(`a file opening on something other than an empty line, which the rule passes over`, () => {
		expect(ask(`a {}\n`, { "@stylistic/no-empty-first-line": true })).toBe(false)
		expect(ask(`\t;\n`, { "@stylistic/no-empty-first-line": true })).toBe(false)
	})

	it(`a file of whitespace alone, which the rule accepts`, () => {
		expect(ask(`\n\n`, { "@stylistic/no-empty-first-line": true })).toBe(false)
		expect(ask(``, { "@stylistic/no-empty-first-line": true })).toBe(false)
	})

	it(`an SCSS file, where the rule is listed under the namespace that reads it`, () => {
		expect(askScss(`\n;\n`, { "@stylistic/scss/no-empty-first-line": true })).toBe(true)
		expect(askScss(`\n;\n`, { "@stylistic/no-empty-first-line": true })).toBe(false)
	})
})

/**
 * Asks the question of a plain CSS stylesheet.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @returns The answer.
 */
function ask (code: string, rules: Record<string, unknown> = {}): boolean {
	return takesTheOpeningLines(parse(code), { stylelint: { config: { rules } } } as unknown as PostcssResult)
}

/**
 * Asks the question of an SCSS stylesheet linted with its syntax.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @returns The answer.
 */
function askScss (code: string, rules: Record<string, unknown>): boolean {
	return takesTheOpeningLines(parseScss(code), { opts: { syntax: postcssScss }, stylelint: { config: { customSyntax: `postcss-scss`, rules } } } as unknown as PostcssResult)
}
