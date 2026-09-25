import type { Container } from "postcss"
import { parse } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { requiresTrailingSemicolon } from "./index.ts"

/**
 * Asks the question about the node closing the one block of a stylesheet read with `postcss-scss`.
 * @param code - The stylesheet.
 * @returns What the util makes of that node.
 */
function lastNode (code: string): boolean {
	let block = parse(code).first as Container
	let node = block.nodes?.findLast((child) => child.type !== `comment`)

	if (!node) throw new Error(`The block holds no node but comments`)

	return requiresTrailingSemicolon(node)
}

describe(`requiresTrailingSemicolon under scss`, () => {
	it(`a custom property a comment follows, which Sass reads into the value once the semicolon is gone`, () => {
		expect(lastNode(`a { --x: 1; // c\n}`)).toBe(true)
		expect(lastNode(`a { --x: 1; /* c */ }`)).toBe(true)
	})

	it(`a bodiless at-rule a block comment follows, which Sass drops from the output once the semicolon is gone`, () => {
		expect(lastNode(`a { @include m; /* c */ }`)).toBe(true)
		expect(lastNode(`a { @include m; // c\n/* d */ }`)).toBe(true)
	})

	it(`a bodiless at-rule only inline comments follow, which stay comments`, () => {
		expect(lastNode(`a { @include m; // c\n}`)).toBe(false)
	})

	it(`a node nothing follows, or a plain declaration, whose semicolon Sass makes optional`, () => {
		expect(lastNode(`a { --x: 1; }`)).toBe(false)
		expect(lastNode(`a { color: red; /* c */ }`)).toBe(false)
	})
})
