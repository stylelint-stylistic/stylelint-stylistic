import { parse } from "postcss"
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
})

function decl (css) {
	let list = []

	parse(css).walkDecls((d) => list.push(d))

	return list[0]
}
