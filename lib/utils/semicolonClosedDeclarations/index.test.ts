import { parse, type Rule } from "postcss"
import { describe, expect, it } from "vitest"

import { semicolonClosedDeclarations } from "./index.ts"

/**
 * Parses a stylesheet and names the declarations listed of its first block.
 * @param css - The stylesheet.
 * @returns The properties.
 */
function propertiesOf (css: string): string[] {
	return semicolonClosedDeclarations(parse(css).first as Rule).map((decl) => decl.prop)
}

describe(`semicolonClosedDeclarations`, () => {
	it(`every declaration of a block closed by a semicolon`, () => {
		expect(propertiesOf(`a { b: c; d: e; }`)).toEqual([`b`, `d`])
	})

	it(`not the declaration the block ends on without a semicolon`, () => {
		expect(propertiesOf(`a { b: c; d: e }`)).toEqual([`b`])
	})

	it(`not the declaration a comment stands behind, no semicolon between them`, () => {
		expect(propertiesOf(`a { b: c; d: e /* f */ }`)).toEqual([`b`])
	})

	it(`the declarations of the blocks the block holds`, () => {
		expect(propertiesOf(`a { b: c; d { e: f; g: h } @media (i) { j: k; } l: m }`)).toEqual([`b`, `e`, `j`])
	})

	it(`nothing of a block holding no declaration`, () => {
		expect(propertiesOf(`a { /* b */ }`)).toEqual([])
	})
})
