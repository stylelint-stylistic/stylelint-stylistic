import { parse } from "postcss"
import { describe, expect, it } from "vitest"

import { declarationValueIndex } from "./index.js"

describe(`declarationValueIndex`, () => {
	it(`has a space before the value`, () => {
		expect(declarationValueIndex(decl(`a { a: b}`))).toBe(3)
	})

	it(`has a colon before the value`, () => {
		expect(declarationValueIndex(decl(`a { a :b }`))).toBe(3)
	})

	it(`has no spaces before the value`, () => {
		expect(declarationValueIndex(decl(`a { a:b }`))).toBe(2)
	})

	it(`has multiple characters before the value`, () => {
		expect(declarationValueIndex(decl(`a { a  : b }`))).toBe(5)
	})

	it(`has a newline before the value`, () => {
		expect(declarationValueIndex(decl(`a { a:\nb }`))).toBe(3)
	})
})

function decl (css) {
	let list = []

	parse(css).walkDecls((d) => list.push(d))

	return list[0]
}
