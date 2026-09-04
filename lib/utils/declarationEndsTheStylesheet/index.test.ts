import { type Declaration, parse, type Root, type Rule } from "postcss"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import type { EmbeddedSource } from "../typeGuards/index.ts"

import { declarationEndsTheStylesheet } from "./index.ts"

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
 * Asks whether one declaration of a stylesheet is the last thing that stylesheet is written with.
 * @param code - The stylesheet.
 * @param [index] - Which declaration of it to ask about, the first by default.
 * @returns True where the stylesheet ends with that declaration.
 */
function endsTheStylesheet (code: string, index?: number): boolean {
	return declarationEndsTheStylesheet(declarationOf(code, index))
}

describe(`declarationEndsTheStylesheet`, () => {
	it(`a declaration standing last at the top level of a stylesheet`, () => {
		expect(endsTheStylesheet(`b:  `)).toBe(true)
		expect(endsTheStylesheet(`b:`)).toBe(true)
		expect(endsTheStylesheet(`--b: \n`)).toBe(true)
		expect(endsTheStylesheet(`a { c: red }\nb:  `, 1)).toBe(true)
	})

	it(`a declaration with a node written behind it, which bounds whatever runs on past it`, () => {
		expect(endsTheStylesheet(`b:  /*c*/`)).toBe(false)
		expect(endsTheStylesheet(`b:  ;\na {}`)).toBe(false)
	})

	it(`a declaration the file closes with a semicolon`, () => {
		expect(endsTheStylesheet(`b:  ;`)).toBe(false)
		expect(endsTheStylesheet(`--b: ;`)).toBe(false)
	})

	it(`a declaration standing inside a block, which the brace closing that block bounds`, () => {
		expect(endsTheStylesheet(`a { b:  }`)).toBe(false)
		expect(endsTheStylesheet(`@font-face { b:  }`)).toBe(false)
	})

	it(`a nested property of Sass, whose block the parser hangs on a declaration`, () => {
		let root = parseScss(`a { font: 2px/3px { family:  } }`)
		let inner = ((root.first as Rule).first as Declaration & { first: Declaration }).first

		expect(declarationEndsTheStylesheet(inner)).toBe(false)
	})

	it(`a declaration the parser hung on no container at all`, () => {
		let decl = declarationOf(`b:  `)

		decl.parent = undefined
		expect(declarationEndsTheStylesheet(decl)).toBe(false)
	})

	it(`a declaration of an inline style attribute, whose root the attribute's own quotation mark closes`, () => {
		let decl = declarationOf(`b:  `)
		let root = decl.parent as Root

		Object.assign(root.source as EmbeddedSource, { inline: true })
		expect(declarationEndsTheStylesheet(decl)).toBe(false)
	})
})
