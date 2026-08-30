import { type Declaration, parse } from "postcss"
import { parse as parseScss, stringify as stringifyScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import type { SyntaxRaw } from "../typeGuards/index.ts"

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

	it(`writes the copy the syntax prints`, () => {
		let node = scssDecl(`a { margin: 0 // c\n  1px }`)

		setDeclarationValue(node, `0 // c\n  2px`)

		expect((node.raws.value as SyntaxRaw).scss).toBe(`0 // c\n  2px`)
	})

	it(`keeps the raw beside it in step`, () => {
		let node = scssDecl(`a { margin: 0 // c\n  1px }`)

		setDeclarationValue(node, `0 // c\n  2px`)

		expect((node.raws.value as SyntaxRaw).raw).toBe(`0 /* c*/\n  2px`)
	})

	it(`the syntax prints what was written`, () => {
		let root = parseScss(`a { margin: 0 // c\n  1px }`)

		root.walkDecls((node) => {
			setDeclarationValue(node, `0 // c\n  2px`)
		})

		expect(root.toString(stringifyScss)).toBe(`a { margin: 0 // c\n  2px }`)
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
