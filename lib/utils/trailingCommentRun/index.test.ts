import postcss, { type AtRule, type Declaration, type Parser, type Stringifier } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { trailingCommentRun } from "./index.ts"

describe(`trailingCommentRun`, () => {
	it(`an inline comment the Less parser keeps behind a declaration's value, moved behind the block's flag with the run in front of it`, () => {
		expect(check(`a {\n\tcolor: pink // c\n}`, less)).toEqual({ run: ` // c`, printed: `a {\n\tcolor: pink; // c\n}` })
		expect(check(`a {\n\tcolor: pink\n\t// c\n}`, less)).toEqual({ run: `\n\t// c`, printed: `a {\n\tcolor: pink;\n\t// c\n}` })
		expect(check(`a {\n\tcolor: pink // c\n\t// d\n}`, less)).toEqual({ run: ` // c\n\t// d`, printed: `a {\n\tcolor: pink; // c\n\t// d\n}` })
	})

	it(`a block comment in front of the inline one, which stays with the code`, () => {
		expect(check(`a {\n\tcolor: pink /* b */ // c\n}`, less)).toEqual({ run: ` // c`, printed: `a {\n\tcolor: pink /* b */; // c\n}` })
	})

	it(`the same comment behind a bodiless at-rule's params, and behind the name of a mixin call written without parentheses, whose params it is the whole of`, () => {
		expect(check(`a {\n\t@extend .b // c\n}`, less)).toEqual({ run: ` // c\n`, printed: `a {\n\t@extend .b; // c\n}` })
		expect(check(`a {\n\t.m\n\t// c\n}`, less)).toEqual({ run: `\n\t// c\n`, printed: `a {\n\t.m;\n\t// c\n}` })
	})

	it(`a block comment behind the inline one on its line, which the Less parser files in front of the brace and which is the inline comment's text`, () => {
		expect(check(`a {\n\t@extend .b // c /* d */\n}`, less)).toEqual({ run: ` // c /* d */\n`, printed: `a {\n\t@extend .b; // c /* d */\n}` })
	})

	it(`the same comment in the raw the Sass parser keeps in front of the brace`, () => {
		expect(check(`a {\n\t@include m // c\n}`, scss)).toEqual({ run: ` // c\n`, printed: `a {\n\t@include m; // c\n}` })
	})

	it(`nothing behind a flag, whose raw the comment would make its text, and nothing where no break closes the comment in front of the brace`, () => {
		expect(check(`a {\n\tcolor: red // c !important;\n}`, less)).toBeNull()
		expect(check(`a { color: pink // c }`, less)).toBeNull()
	})

	it(`nothing where the text ends in code, or in a comment plain CSS does not read`, () => {
		expect(check(`a {\n\tcolor: pink /* c */\n}`, less)).toBeNull()
		expect(check(`a {\n\tcolor: pink // c\n}`)).toBeNull()
	})
})

/**
 * Reads the run behind the first node of the first rule through the core's syntax, whose reading the namespaces share, and prints the root once the run has moved and the flag is set.
 * @param code - The stylesheet.
 * @param parser - The parser.
 * @returns The run and the printed root, or null where there is no run.
 */
function check (code: string, parser: { parse: Parser } = postcss): { run: string, printed: string } | null {
	let root = parser.parse(code, { from: undefined })
	let node = (root.first as { first: AtRule | Declaration }).first
	let result = { opts: { syntax: parser }, stylelint: { config: { customSyntax: parser === postcss ? undefined : (parser === less ? `postcss-less` : `postcss-scss`) } } } as unknown as PostcssResult
	let found = trailingCommentRun(css, node, result)

	if (!found) return null

	found.move()
	if (node.parent) node.parent.raws.semicolon = true

	return { run: found.run, printed: root.toString(parser as unknown as { stringify: Stringifier }) }
}
