import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { parse } from "postcss"

import { declarationValueIndex } from "./index.js"

describe(`declarationValueIndex`, () => {
	it(`has a space before the value`, () => {
		equal(declarationValueIndex(decl(`a { a: b}`)), 3)
	})

	it(`has a colon before the value`, () => {
		equal(declarationValueIndex(decl(`a { a :b }`)), 3)
	})

	it(`has no spaces before the value`, () => {
		equal(declarationValueIndex(decl(`a { a:b }`)), 2)
	})

	it(`has multiple characters before the value`, () => {
		equal(declarationValueIndex(decl(`a { a  : b }`)), 5)
	})

	it(`has a newline before the value`, () => {
		equal(declarationValueIndex(decl(`a { a:\nb }`)), 3)
	})
})

function decl (css) {
	let list = []

	parse(css).walkDecls((d) => list.push(d))

	return list[0]
}
