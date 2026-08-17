import { parse } from "postcss"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { getDeclarationValue } from "./index.js"

describe(`getDeclarationValue`, () => {
	it(`has no comment in the value`, () => {
		expect(getDeclarationValue(decl(`a { color: pink }`))).toBe(`pink`)
	})

	it(`has a comment in front of the value`, () => {
		expect(getDeclarationValue(decl(`a { color: /* c */ pink }`))).toBe(`pink`)
	})

	it(`has a comment inside the value`, () => {
		expect(getDeclarationValue(decl(`a { margin: 0 /* c */ 1px }`))).toBe(`0 /* c */ 1px`)
	})

	it(`has a comment inside a custom property`, () => {
		expect(getDeclarationValue(decl(`a { --foo: 0 /* c */ 1px }`))).toBe(`0 /* c */ 1px `)
	})

	it(`has an inline comment inside the value, which the syntax spells in a copy of its own`, () => {
		expect(getDeclarationValue(scssDecl(`a { margin: 0 // c\n  1px }`))).toBe(`0 // c\n  1px`)
	})

	it(`has a block comment inside the value, which the syntax keeps one copy of`, () => {
		expect(getDeclarationValue(scssDecl(`a { margin: 0 /* c */ 1px }`))).toBe(`0 /* c */ 1px`)
	})
})

function decl (css) {
	let list = []

	parse(css).walkDecls((d) => list.push(d))

	return list[0]
}

function scssDecl (css) {
	let list = []

	parseScss(css).walkDecls((d) => list.push(d))

	return list[0]
}
