import { parse } from "postcss"
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
})

function decl (css) {
	let list = []

	parse(css).walkDecls((d) => list.push(d))

	return list[0]
}
