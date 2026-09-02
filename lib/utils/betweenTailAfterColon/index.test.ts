import { type Declaration, parse } from "postcss"
import { describe, expect, it } from "vitest"

import { betweenTailAfterColon } from "./index.ts"

/**
 * Parses one declaration out of a block.
 * @param css - The block to parse.
 * @returns Its first declaration.
 */
function declarationOf (css: string): Declaration {
	let decl: Declaration | undefined

	parse(css).walkDecls((found) => {
		decl ??= found
	})

	if (!decl) throw new Error(`The block holds no declaration`)

	return decl
}

describe(`betweenTailAfterColon`, () => {
	it(`the parser's own layouts: the trimmed run of a worded value, and nothing on a whitespace-only one`, () => {
		expect(betweenTailAfterColon(declarationOf(`a { b:\nx; }`))).toBe(`\n`)
		expect(betweenTailAfterColon(declarationOf(`a { --b: ; }`))).toBe(``)
	})

	it(`a colon a comment of the between spells is not the declaration's: the tail runs from the first colon outside comments`, () => {
		let decl = declarationOf(`a { b: x; }`)

		decl.raws.between = `:\n/*x:y*/ `
		expect(betweenTailAfterColon(decl)).toBe(`\n/*x:y*/ `)
	})

	it(`a between spelling no colon is handed back whole`, () => {
		let decl = declarationOf(`a { b: x; }`)

		decl.raws.between = ` `
		expect(betweenTailAfterColon(decl)).toBe(` `)
	})
})
