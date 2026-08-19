import { parse } from "postcss"
import { describe, expect, it } from "vitest"

import { isLastDeclarationWithoutSemicolon } from "./index.js"

/**
 * Parses a block and hands back its first declaration.
 * @param {string} css - The stylesheet.
 * @returns {import('postcss').Declaration} The first declaration of the first block.
 */
function firstDeclaration (css) {
	let decl = /** @type {import('postcss').Rule} */ (parse(css).first).nodes.find((node) => node.type === `decl`)

	return /** @type {import('postcss').Declaration} */ (decl)
}

describe(`isLastDeclarationWithoutSemicolon`, () => {
	it(`the only declaration, no semicolon`, () => {
		expect(isLastDeclarationWithoutSemicolon(firstDeclaration(`a { color: pink }`))).toBe(true)
	})

	it(`the only declaration, with a semicolon`, () => {
		expect(isLastDeclarationWithoutSemicolon(firstDeclaration(`a { color: pink; }`))).toBe(false)
	})

	it(`a comment closing the block behind the declaration`, () => {
		expect(isLastDeclarationWithoutSemicolon(firstDeclaration(`a { color: pink /* c */ }`))).toBe(true)
	})

	it(`two comments closing the block behind the declaration`, () => {
		expect(isLastDeclarationWithoutSemicolon(firstDeclaration(`a { color: pink /* c */\n/* d */ }`))).toBe(true)
	})

	it(`a comment closing the block behind the declaration's semicolon`, () => {
		expect(isLastDeclarationWithoutSemicolon(firstDeclaration(`a { color: pink; /* c */ }`))).toBe(false)
	})

	it(`a nested rule closing the block, whose declaration keeps its semicolon`, () => {
		expect(isLastDeclarationWithoutSemicolon(firstDeclaration(`a { color: pink; b {} }`))).toBe(false)
	})

	it(`a nested at-rule without a semicolon closing the block, the flag speaking of it and not of the declaration`, () => {
		expect(isLastDeclarationWithoutSemicolon(firstDeclaration(`a { color: pink; @include x }`))).toBe(false)
	})

	it(`a declaration standing in front of another`, () => {
		expect(isLastDeclarationWithoutSemicolon(firstDeclaration(`a { color: pink; top: 0 }`))).toBe(false)
	})

	it(`a declaration on the root, which has no block to close`, () => {
		let decl = /** @type {import('postcss').Declaration} */ (parse(`color: pink`).first)

		expect(isLastDeclarationWithoutSemicolon(decl)).toBe(true)
	})
})
