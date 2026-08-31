import { type Declaration, parse } from "postcss"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import { css as syntax } from "../../syntaxes/css/index.ts"

import { declarationString } from "./index.ts"

describe(`declarationString`, () => {
	it(`has no comment in the value`, () => {
		expect(declarationString(syntax, decl(`a { color: pink }`))).toBe(`color: pink`)
	})

	it(`has a bang`, () => {
		expect(declarationString(syntax, decl(`a { color: pink !important }`))).toBe(`color: pink !important`)
	})

	it(`has a bang spelled its own way`, () => {
		expect(declarationString(syntax, decl(`a { color: pink  ! important }`))).toBe(`color: pink  ! important`)
	})

	it(`has a comment inside the value`, () => {
		expect(declarationString(syntax, decl(`a { margin: 0 /* c */ 1px }`))).toBe(`margin: 0 /* c */ 1px`)
	})

	it(`has an inline comment inside the value, which the syntax spells in a copy of its own`, () => {
		expect(declarationString(syntax, scssDecl(`a { margin: 0 // c\n  1px !important }`))).toBe(`margin: 0 // c\n  1px !important`)
	})
})

/**
 * Reads the first declaration of a stylesheet.
 * @param css - The stylesheet.
 * @returns That declaration.
 */
function decl (css: string): Declaration {
	let list: Declaration[] = []

	parse(css).walkDecls((d) => {
		list.push(d)
	})

	return pick(list)
}

/**
 * Reads the first declaration of a stylesheet written in SCSS.
 * @param css - The stylesheet.
 * @returns That declaration.
 */
function scssDecl (css: string): Declaration {
	let list: Declaration[] = []

	parseScss(css).walkDecls((d) => {
		list.push(d)
	})

	return pick(list)
}
