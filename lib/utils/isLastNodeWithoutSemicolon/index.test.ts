import { type AtRule, type Declaration, parse, type Rule } from "postcss"
import { describe, expect, it } from "vitest"

import { isLastNodeWithoutSemicolon } from "./index.ts"

/**
 * Parses a block and hands back its first declaration.
 * @param css - The stylesheet.
 * @returns The first declaration of the first block.
 */
function firstDeclaration (css: string): Declaration {
	let decl = (parse(css).first as Rule).nodes.find((node) => node.type === `decl`)

	return decl as Declaration
}

/**
 * Parses a stylesheet and hands back its first at-rule, wherever it stands.
 * @param css - The stylesheet.
 * @returns The first at-rule.
 */
function firstAtRule (css: string): AtRule {
	let found: AtRule | undefined

	parse(css).walkAtRules((atRule) => {
		found ??= atRule
	})

	return found as AtRule
}

describe(`isLastNodeWithoutSemicolon`, () => {
	it(`the only declaration, no semicolon`, () => {
		expect(isLastNodeWithoutSemicolon(firstDeclaration(`a { color: pink }`))).toBe(true)
	})

	it(`the only declaration, with a semicolon`, () => {
		expect(isLastNodeWithoutSemicolon(firstDeclaration(`a { color: pink; }`))).toBe(false)
	})

	it(`a comment closing the block behind the declaration`, () => {
		expect(isLastNodeWithoutSemicolon(firstDeclaration(`a { color: pink /* c */ }`))).toBe(true)
	})

	it(`two comments closing the block behind the declaration`, () => {
		expect(isLastNodeWithoutSemicolon(firstDeclaration(`a { color: pink /* c */\n/* d */ }`))).toBe(true)
	})

	it(`a comment closing the block behind the declaration's semicolon`, () => {
		expect(isLastNodeWithoutSemicolon(firstDeclaration(`a { color: pink; /* c */ }`))).toBe(false)
	})

	it(`a nested rule closing the block, whose declaration keeps its semicolon`, () => {
		expect(isLastNodeWithoutSemicolon(firstDeclaration(`a { color: pink; b {} }`))).toBe(false)
	})

	it(`a nested at-rule without a semicolon closing the block, the flag speaking of it and not of the declaration`, () => {
		expect(isLastNodeWithoutSemicolon(firstDeclaration(`a { color: pink; @include x }`))).toBe(false)
	})

	it(`a declaration standing in front of another`, () => {
		expect(isLastNodeWithoutSemicolon(firstDeclaration(`a { color: pink; top: 0 }`))).toBe(false)
	})

	it(`a declaration on the root, which has no block to close`, () => {
		let decl = parse(`color: pink`).first as Declaration

		expect(isLastNodeWithoutSemicolon(decl)).toBe(true)
	})

	it(`the only at-rule of a block, no semicolon`, () => {
		expect(isLastNodeWithoutSemicolon(firstAtRule(`a { @include x }`))).toBe(true)
	})

	it(`the only at-rule of a block, with a semicolon`, () => {
		expect(isLastNodeWithoutSemicolon(firstAtRule(`a { @include x; }`))).toBe(false)
	})

	it(`a comment closing the block behind the at-rule's semicolon`, () => {
		expect(isLastNodeWithoutSemicolon(firstAtRule(`a { @include x; /* c */ }`))).toBe(false)
	})

	it(`an at-rule standing in front of a declaration`, () => {
		expect(isLastNodeWithoutSemicolon(firstAtRule(`a { @include x; color: pink }`))).toBe(false)
	})

	it(`an at-rule closing the file, which has no block to close`, () => {
		expect(isLastNodeWithoutSemicolon(firstAtRule(`@import "x"`))).toBe(true)
	})

	it(`an at-rule closing the file with a semicolon`, () => {
		expect(isLastNodeWithoutSemicolon(firstAtRule(`@import "x";`))).toBe(false)
	})
})
