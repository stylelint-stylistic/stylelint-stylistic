import { type Declaration, parse, type Root } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { EmbeddedSource } from "../typeGuards/index.ts"

import { runInDeclarationEndsTheStylesheet } from "./index.ts"

/** The least of a Stylelint result, which names no syntax, so that the stylesheet is read as plain CSS. */
const RESULT = {} as unknown as PostcssResult

/**
 * Parses one declaration out of a stylesheet.
 * @param code - The stylesheet.
 * @param [index] - Which declaration of it to take, the first by default.
 * @returns That declaration.
 */
function declarationOf (code: string, index: number = 0): Declaration {
	let found: Declaration[] = []

	parse(code).walkDecls((decl) => {
		found.push(decl)
	})

	let decl = found[index]

	if (!decl) throw new Error(`The stylesheet holds no such declaration`)

	return decl
}

/**
 * Asks whether the whitespace one declaration of a stylesheet prints behind its colon is the text that stylesheet ends on.
 * @param code - The stylesheet.
 * @param [index] - Which declaration of it to ask about, the first by default.
 * @returns True where the declaration prints a run of whitespace behind its colon and the stylesheet ends on it.
 */
function endsTheStylesheet (code: string, index?: number): boolean {
	return runInDeclarationEndsTheStylesheet(css, declarationOf(code, index), RESULT)
}

describe(`runInDeclarationEndsTheStylesheet`, () => {
	it(`a custom property standing last at the top level of a stylesheet, whose value is the tail of the file`, () => {
		expect(endsTheStylesheet(`--b: \n`)).toBe(true)
		expect(endsTheStylesheet(`--b: `)).toBe(true)
		expect(endsTheStylesheet(`--b:\n`)).toBe(true)
		expect(endsTheStylesheet(`--b:\t \n`)).toBe(true)
		expect(endsTheStylesheet(`a { c: red }\n--b: \n`, 1)).toBe(true)
	})

	it(`a run a fix of the neighbouring rule has moved onto the tail of the raw between the property and the value`, () => {
		let decl = declarationOf(`--b: \n`)

		decl.raws.between = `:\n`
		decl.value = ``
		expect(runInDeclarationEndsTheStylesheet(css, decl, RESULT)).toBe(true)
	})

	it(`a declaration printing nothing at all behind its colon, whose run has left it for the stylesheet's own raw`, () => {
		expect(endsTheStylesheet(`b: `)).toBe(false)
		expect(endsTheStylesheet(`--b:`)).toBe(false)
	})

	it(`a value holding a word of its own, which the run behind the colon does not reach the end of`, () => {
		expect(endsTheStylesheet(`--b: red`)).toBe(false)
		expect(endsTheStylesheet(`--b: /*c*/ `)).toBe(false)
	})

	it(`a flag, behind which the file writes what it ends on out of the raw the flag carries`, () => {
		expect(endsTheStylesheet(`--b: !important`)).toBe(false)
		expect(endsTheStylesheet(`--b: !important\n`)).toBe(false)
	})

	it(`a declaration the stylesheet does not end with, whose run of whitespace a brace or a semicolon bounds`, () => {
		expect(endsTheStylesheet(`a { --b: \n}`)).toBe(false)
		expect(endsTheStylesheet(`a { --b: }`)).toBe(false)
		expect(endsTheStylesheet(`--b: ;`)).toBe(false)
	})

	it(`a declaration of an inline style attribute, whose root the attribute's own quotation mark closes`, () => {
		let decl = declarationOf(`--b: `)
		let root = decl.parent as Root

		Object.assign(root.source as EmbeddedSource, { inline: true })
		expect(runInDeclarationEndsTheStylesheet(css, decl, RESULT)).toBe(false)
	})

	it(`a declaration whose colon the reading cannot find, which has no run behind a colon to speak of`, () => {
		let decl = declarationOf(`--b: `)

		decl.raws.between = ` `
		expect(runInDeclarationEndsTheStylesheet(css, decl, RESULT)).toBe(false)
	})
})
