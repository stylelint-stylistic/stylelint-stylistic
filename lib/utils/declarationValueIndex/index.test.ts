import { type Declaration, parse } from "postcss"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"

import { declarationValueIndex } from "./index.ts"

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
