import { parse } from "postcss"
import postcssScss, { parse as parseScss } from "postcss-scss"
import * as postcssStyledSyntax from "postcss-styled-syntax"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { isRoot } from "../typeGuards/index.ts"

import { takesTheOpeningLines } from "./index.ts"

/** The core with the styled adapter's answer about a template's edges, which a test of the core may not import; the adapter's own answer is pinned by the suites under its namespace. */
const OPENING_ON_THE_HOST_LINE: Syntax = { ...css, hostLineEdges: () => ({ opens: true, closes: false }) }

describe(`takesTheOpeningLines`, () => {
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

	it(`a copy under the namespace of another syntax, which reads a plain CSS file too, the first listed where two are`, () => {
		expect(ask(`\n;\n`, { "@stylistic/scss/no-empty-first-line": true })).toBe(true)
		expect(ask(`\n;\n`, { "@stylistic/less/no-empty-first-line": [true, { disableFix: true }], "@stylistic/scss/no-empty-first-line": true })).toBe(false)
	})

	it(`a file opening on something other than an empty line, which the rule passes over`, () => {
		expect(ask(`a {}\n`, { "@stylistic/no-empty-first-line": true })).toBe(false)
		expect(ask(`\t;\n`, { "@stylistic/no-empty-first-line": true })).toBe(false)
	})

	it(`a file opening on a line holding nothing but a semicolon the neighbor takes out, which it leaves empty`, () => {
		expect(ask(`;\n\na {}\n`, { "@stylistic/no-empty-first-line": true, "@stylistic/no-extra-semicolons": true })).toBe(true)
		expect(ask(`;\n\na {}\n`, { "@stylistic/no-empty-first-line": true })).toBe(false)
		expect(ask(`\n;\n`, { "@stylistic/no-empty-first-line": true, "@stylistic/no-extra-semicolons": true })).toBe(false)
	})

	it(`a file of whitespace alone, which the rule accepts`, () => {
		expect(ask(`\n\n`, { "@stylistic/no-empty-first-line": true })).toBe(false)
		expect(ask(``, { "@stylistic/no-empty-first-line": true })).toBe(false)
	})

	it(`an SCSS file, where the rule is listed under the namespace that reads it`, () => {
		expect(askScss(`\n;\n`, { "@stylistic/scss/no-empty-first-line": true })).toBe(true)
		expect(askScss(`\n;\n`, { "@stylistic/no-empty-first-line": true })).toBe(false)
	})

	it(`a styled template, whose first break ends the line of the host code and whose second opens an empty line`, () => {
		expect(askStyled(`\n\n;`, { "@stylistic/styled/no-empty-first-line": true })).toBe(true)
		expect(askStyled(`\n;`, { "@stylistic/styled/no-empty-first-line": true })).toBe(false)
		expect(askStyled(`\n\n\ta {}\n`, { "@stylistic/styled/no-empty-first-line": true })).toBe(true)
		expect(askStyled(`\n\ta {}\n`, { "@stylistic/styled/no-empty-first-line": true })).toBe(false)
	})
})

/**
 * Asks the question of a plain CSS stylesheet.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @returns The answer.
 */
function ask (code: string, rules: Record<string, unknown> = {}): boolean {
	return takesTheOpeningLines(parse(code), { stylelint: { config: { rules } } } as unknown as PostcssResult, css)
}

/**
 * Asks the question of an SCSS stylesheet linted with its syntax.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @returns The answer.
 */
function askScss (code: string, rules: Record<string, unknown>): boolean {
	// The SCSS adapter answers about the edges as the core does
	return takesTheOpeningLines(parseScss(code), { opts: { syntax: postcssScss }, stylelint: { config: { customSyntax: `postcss-scss`, rules } } } as unknown as PostcssResult, css)
}

/**
 * Asks the question of a styled template linted with its syntax.
 * @param template - The template's text, between the backticks.
 * @param rules - The rules the configuration lists.
 * @returns The answer.
 */
function askStyled (template: string, rules: Record<string, unknown>): boolean {
	let root = postcssStyledSyntax.parse(`const A = styled.div\`${template}\`\n`).first

	if (!root || !isRoot(root)) throw new Error(`The template must parse into a root`)

	return takesTheOpeningLines(root, { opts: { syntax: postcssStyledSyntax }, stylelint: { config: { customSyntax: `postcss-styled-syntax`, rules } } } as unknown as PostcssResult, OPENING_ON_THE_HOST_LINE)
}
