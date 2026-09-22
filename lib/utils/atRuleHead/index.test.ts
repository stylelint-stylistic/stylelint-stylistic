import postcss, { type AtRule, type Parser } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { atRuleHead } from "./index.ts"

describe(`atRuleHead`, () => {
	it(`an at-rule with neither block nor semicolon, whose swallowed comment PostCSS files in front of the brace`, () => {
		expect(check(`a {\n\t@extend .b\n\t/* c */\n}`)).toEqual({ head: `@extend .b`, swallowedLines: `\n\t/* c */` })
		expect(check(`a {\n\t@include m\n\t// c\n}`, scss)).toEqual({ head: `@include m`, swallowedLines: `\n\t// c` })
	})

	it(`an inline comment the Less parser leaves in the params behind a mixin call, cut off the head and opening the swallowed lines`, () => {
		expect(check(`a {\n\t.m()\n\t// c\n}`, less)).toEqual({ head: `@m()`, swallowedLines: `\n\t// c` })
		expect(check(`a {\n\t.m() // c\n\t// d\n}`, less)).toEqual({ head: `@m()`, swallowedLines: ` // c\n\t// d` })
		expect(check(`a {\n\t.m()\n\t// c;\n}`, less)).toEqual({ head: `@m()`, swallowedLines: `\n\t// c` })
	})

	it(`the same comment behind a call written without parentheses, the params made of the comment alone and the break filed behind the name`, () => {
		expect(check(`a {\n\t.m\n\t// c\n}`, less)).toEqual({ head: `@m`, swallowedLines: `\n\t// c` })
	})

	it(`the same comment in front of an at-rule's opening brace, kept in the head`, () => {
		expect(check(`@media (a)\n\t// c\n{\n\tb { c: d; }\n}`, less)).toEqual({ head: `@media (a)\n\t// c`, swallowedLines: `` })
	})

	it(`a double slash that opens no comment in plain CSS, kept in the head`, () => {
		expect(check(`a {\n\t@extend .b\n\t// c\n}`)).toEqual({ head: `@extend .b\n\t// c`, swallowedLines: `` })
	})
})

/**
 * Reads the first at-rule of the first rule of a stylesheet through the core's syntax, whose reading of the params and of their comments the namespaces share; which double slashes are comments is the parser's answer.
 * @param code - The stylesheet.
 * @param parser - The parser.
 * @returns The head and the swallowed lines.
 */
function check (code: string, parser: { parse: Parser } = postcss): { head: string, swallowedLines: string } {
	let root = parser.parse(code, { from: undefined })
	let atRule = (root.first?.type === `atrule` ? root.first : (root.first as { first: AtRule }).first)
	let result = { opts: { syntax: parser }, stylelint: { config: { customSyntax: parser === postcss ? undefined : (parser === less ? `postcss-less` : `postcss-scss`) } } } as unknown as PostcssResult

	return atRuleHead(css, atRule, result)
}
