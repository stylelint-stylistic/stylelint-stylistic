import { type Declaration, parse } from "postcss"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"

import { setDeclarationValue } from "./index.ts"

describe(`setDeclarationValue`, () => {
	it(`has no comment in the value`, () => {
		let node = decl(`a { color: pink }`)

		setDeclarationValue(node, `red`)

		expect(node.value).toBe(`red`)
		expect(node.toString()).toBe(`color: red`)
	})

	it(`has a comment inside the value`, () => {
		let node = decl(`a { margin: 0 /* c */ 1px }`)

		setDeclarationValue(node, `0 /* c */ 2px`)

		expect(node.toString()).toBe(`margin: 0 /* c */ 2px`)
	})

	it(`keeps the cleaned value untouched when a comment was dropped from it`, () => {
		let node = decl(`a { margin: 0 /* c */ 1px }`)

		setDeclarationValue(node, `0 /* c */ 2px`)

		expect(node.value).toBe(`0  1px`)
	})

	it(`returns the declaration it was given`, () => {
		let node = decl(`a { color: pink }`)

		expect(setDeclarationValue(node, `red`)).toBe(node)
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
