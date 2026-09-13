import postcss, { type Container, type Parser } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { statementString } from "./index.ts"

describe(`statementString`, () => {
	it(`prints a rule with nothing behind its brace`, () => {
		expect(check(`a { color: pink }\n`)).toBe(`a { color: pink }`)
	})

	it(`prints a rule through its brace where a stray semicolon abuts it`, () => {
		expect(check(`a { color: pink };\n`)).toBe(`a { color: pink }`)
	})

	it(`prints a rule through its brace where a stray semicolon stands on the next line`, () => {
		expect(check(`a { color: pink }\n\t;\n`)).toBe(`a { color: pink }`)
	})

	it(`prints a rule through its brace under both custom syntaxes`, () => {
		expect(check(`a { color: pink } ;\n`, scss)).toBe(`a { color: pink }`)
		expect(check(`a { color: pink } ;\n`, less)).toBe(`a { color: pink }`)
	})

	it(`prints an at-rule a stray semicolon stands behind, which the parent's raw holds instead`, () => {
		expect(check(`@media print { a { color: pink } } ;\n`)).toBe(`@media print { a { color: pink } }`)
	})
})

/**
 * Reads the first statement of a stylesheet and prints it.
 * @param cssString - The stylesheet.
 * @param syntax - The syntax to read it with.
 * @returns What the util answers.
 */
function check (cssString: string, syntax: { parse: Parser } = postcss): string {
	let root = syntax.parse(cssString, { from: undefined })

	return statementString(root.first as Container, { opts: { syntax } } as unknown as PostcssResult)
}
