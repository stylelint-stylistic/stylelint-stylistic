import type { AtRule } from "postcss"
import postcssLess from "postcss-less"
import { describe, expect, it } from "vitest"

import { pick } from "../../../../vitest.helpers.ts"

import { isLessVariableDeclaration } from "./index.ts"

describe(`isLessVariableDeclaration`, () => {
	it(`a variable declaration the parser marked`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@v: pink; a { b: @v }`))).toBe(true)
	})

	it(`the declaration of a detached ruleset the parser marked`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@dr: { color: red; }; a { @dr(); }`))).toBe(true)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/394
	it(`a variable declared with whitespace in front of its colon, which the parser leaves unmarked`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@v : pink; a { b: @v }`))).toBe(true)
		expect(isLessVariableDeclaration(lessAtRule(`@v\t: pink; a { b: @v }`))).toBe(true)
		expect(isLessVariableDeclaration(lessAtRule(`@v\n: pink; a { b: @v }`))).toBe(true)
		expect(isLessVariableDeclaration(lessAtRule(`@v :pink; a { b: @v }`))).toBe(true)
	})

	it(`a variable declared with no whitespace on either side of its colon, which the parser reads into the name`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@v:pink; a { b: @v }`))).toBe(true)
		expect(isLessVariableDeclaration(lessAtRule(`@v:pink 1px; a { b: @v }`))).toBe(true)
	})

	it(`a variable declared with whitespace in front of its colon and a flag, a comment or nothing at all behind it`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@v : pink !important; a { b: @v }`))).toBe(true)
		expect(isLessVariableDeclaration(lessAtRule(`@v : pink /* c */; a { b: @v }`))).toBe(true)
		expect(isLessVariableDeclaration(lessAtRule(`@v : ; a { b: c }`))).toBe(true)
	})

	it(`a detached ruleset declared with whitespace in front of its colon`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@dr : { color: red; }; a { @dr(); }`))).toBe(true)
		expect(isLessVariableDeclaration(lessAtRule(`@dr :{ color: red; }; a { @dr(); }`))).toBe(true)
	})

	it(`an at-rule named for a variable whose parameters open on a colon, which Less reads as the variable all the same`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@import : "x";`))).toBe(true)
		expect(isLessVariableDeclaration(lessAtRule(`@custom-selector :--heading h1, h2;`))).toBe(true)
	})

	it(`an at-rule whose parameters open on a colon Less cannot read a value behind, which it prints back as an at-rule and which is passed over here all the same`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@custom-media :x (min-width: 1px);`))).toBe(true)
	})

	it(`a page rule whose selector opens on a colon, which is an at-rule to Less`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@page :first { margin: 0 }`))).toBe(false)
		expect(isLessVariableDeclaration(lessAtRule(`@page : first { margin: 0 }`))).toBe(false)
	})

	it(`an at-rule carrying a block behind something more than the colon, which Less prints back as it stands`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@v : red { c: red }`))).toBe(false)
		expect(isLessVariableDeclaration(lessAtRule(`@supports :x { a { b: c } }`))).toBe(false)
	})

	it(`an at-rule whose name holds a colon in front of a block, which declares no variable to Less`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@v:pink { c: red }`))).toBe(false)
		expect(isLessVariableDeclaration(lessAtRule(`@page:first { margin: 0 }`))).toBe(false)
	})

	it(`an ordinary at-rule, with a block and without`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@media (a: b) { c { d: e } }`))).toBe(false)
		expect(isLessVariableDeclaration(lessAtRule(`@import (reference) "x";`))).toBe(false)
		expect(isLessVariableDeclaration(lessAtRule(`@import(reference) "x";`))).toBe(false)
	})

	it(`a call to a detached ruleset, which declares nothing`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`@dr: { color: red; }; a { @dr(); }`, 1))).toBe(false)
	})

	it(`a mixin call, which carries a mark of its own`, () => {
		expect(isLessVariableDeclaration(lessAtRule(`a { .mixin(); }`))).toBe(false)
	})
})

/**
 * Reads one at-rule of a stylesheet written in Less.
 * @param code - The stylesheet.
 * @param index - Which at-rule, counted in the order the walk meets them.
 * @returns That at-rule.
 */
function lessAtRule (code: string, index: number = 0): AtRule {
	let atRules: AtRule[] = []

	postcssLess.parse(code).walkAtRules((atRule) => {
		atRules.push(atRule)
	})

	return pick(atRules, index)
}
