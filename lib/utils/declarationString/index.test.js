import { parse } from "postcss"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { declarationString } from "./index.js"

describe(`declarationString`, () => {
	it(`has no comment in the value`, () => {
		expect(declarationString(decl(`a { color: pink }`))).toBe(`color: pink`)
	})

	it(`has a bang`, () => {
		expect(declarationString(decl(`a { color: pink !important }`))).toBe(`color: pink !important`)
	})

	it(`has a bang spelled its own way`, () => {
		expect(declarationString(decl(`a { color: pink  ! important }`))).toBe(`color: pink  ! important`)
	})

	it(`has a comment inside the value`, () => {
		expect(declarationString(decl(`a { margin: 0 /* c */ 1px }`))).toBe(`margin: 0 /* c */ 1px`)
	})

	it(`has an inline comment inside the value, which the syntax spells in a copy of its own`, () => {
		expect(declarationString(scssDecl(`a { margin: 0 // c\n  1px !important }`))).toBe(`margin: 0 // c\n  1px !important`)
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
