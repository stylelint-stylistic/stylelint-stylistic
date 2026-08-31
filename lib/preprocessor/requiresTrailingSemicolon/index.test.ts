import { type AtRule, type Container, type Document, parse, type Parser, type ProcessOptions, type Root, type Rule } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import type { EmbeddedSource } from "../../utils/typeGuards/index.ts"

import { requiresTrailingSemicolon } from "./index.ts"

/**
 * The last node of the one block of a stylesheet, read with one syntax and asked about under another.
 * @param syntax - The syntax the stylesheet is parsed with, and the one the question is asked under unless another is named.
 * @param code - The stylesheet.
 * @param asked - The syntax to ask the question under, where it is not the one that parsed.
 * @returns What the util makes of that node.
 */
function lastNodeOfTheBlock (syntax: { parse: Parser }, code: string, asked?: unknown): boolean {
	let root = syntax.parse(code, { from: undefined })
	let block = root.last as Container
	let node = block.nodes ? block.last : block

	if (!node) throw new Error(`The block holds no node`)

	return requiresTrailingSemicolon(node, { opts: { syntax: asked === undefined ? syntax : asked } } as unknown as PostcssResult)
}

/**
 * The same, with the node named on its own and the block spelled around it.
 * @param node - The text of the node closing the block.
 * @returns What the util makes of that node under Less.
 */
function closingALessBlock (node: string): boolean {
	return lastNodeOfTheBlock(less, `a { ${node}; }`)
}

describe(`requiresTrailingSemicolon`, () => {
	describe(`the syntax`, () => {
		it(`no syntax at all, which is plain CSS`, () => {
			let rule = parse(`a { @layer l; }`).first as Rule

			expect(requiresTrailingSemicolon(rule.first as AtRule, { opts: {} } as unknown as PostcssResult)).toBe(false)
		})

		it(`a syntax that reads the probe and spells no Less variable in it`, () => {
			expect(lastNodeOfTheBlock(scss, `a { @extend .b; }`)).toBe(false)
		})

		it(`a syntax that reads the probe as Less`, () => {
			expect(lastNodeOfTheBlock(less, `a { @extend .b; }`)).toBe(true)
		})

		it(`something that cannot be asked, which reads no stylesheet at all`, () => {
			expect(lastNodeOfTheBlock(less, `a { @extend .b; }`, {})).toBe(false)
		})

		it(`a syntax that throws on the probe, which Less would have read`, () => {
			expect(lastNodeOfTheBlock(less, `a { @extend .b; }`, { parse () { throw new Error(`no`) } })).toBe(false)
		})

		it(`a host language, which finds no stylesheet in a bare one and names the syntax of every block it does find`, () => {
			expect(lastNodeOfTheBlock(less, `a { @extend .b; }`, { parse: () => parse(``) })).toBe(false)
		})

		it(`the syntax of the node's own stylesheet, which is asked ahead of the one the file was opened with`, () => {
			let root = less.parse(`a { @extend .b; }`, { from: undefined })
			let source = root.source as EmbeddedSource
			let rule = root.first as Rule

			source.syntax = scss

			expect(requiresTrailingSemicolon(rule.last as AtRule, { opts: { syntax: less } } as unknown as PostcssResult)).toBe(false)
		})

		it(`one parse of the probe per syntax, however many nodes are asked about`, () => {
			let parses = 0
			let counted = {

				/**
				 * Parses as Less does, and counts the call.
				 * @param code - The stylesheet.
				 * @param options - The options of the parse.
				 * @returns What Less makes of it.
				 */
				parse (code: string, options?: ProcessOptions): Root | Document {
					parses += 1

					return less.parse(code, options)
				},
			}

			lastNodeOfTheBlock(less, `a { @extend .b; }`, counted)
			lastNodeOfTheBlock(less, `a { @extend .b; }`, counted)

			expect(parses).toBe(1)
		})
	})

	describe(`the node`, () => {
		it(`an at-rule Less reads as an at-rule`, () => {
			expect(closingALessBlock(`@extend .b`)).toBe(true)
		})

		it(`an at-rule carrying a block of its own, which ends on that block's closing brace rather than on a semicolon`, () => {
			expect(lastNodeOfTheBlock(less, `a { @media x { b: c; } }`)).toBe(false)
		})

		it(`an at-rule whose options open with a parenthesis behind a space`, () => {
			expect(closingALessBlock(`@import (reference) "x"`)).toBe(true)
		})

		it(`the same at-rule spelled without that space, which the parser files as it files a call to a detached ruleset`, () => {
			expect(closingALessBlock(`@import(reference) "x"`)).toBe(true)
		})

		it(`a plain CSS at-rule spelled the same way`, () => {
			expect(closingALessBlock(`@supports(a: b)`)).toBe(true)
		})

		it(`a variable declaration, which Less reads as a declaration and this reading does not, its value being no text this plugin parses the way Less parses it`, () => {
			expect(closingALessBlock(`@v: pink`)).toBe(true)
		})

		it(`the same declaration with the colon parted from the name`, () => {
			expect(closingALessBlock(`@v : pink`)).toBe(true)
		})

		it(`a value Less itself refuses in a declaration, which is what telling one from an at-rule would have to catch`, () => {
			expect(closingALessBlock(`@v: pink !IMPORTANT`)).toBe(true)
		})

		it(`a variable spelling no value at all, which Less reads as a directive rather than as a declaration`, () => {
			expect(closingALessBlock(`@v:`)).toBe(true)
		})

		it(`a call to a detached ruleset, which Less reads as a call`, () => {
			expect(closingALessBlock(`@dr()`)).toBe(false)
		})

		it(`the same call with a space in front of its parentheses, which makes an at-rule of it again`, () => {
			expect(closingALessBlock(`@dr ()`)).toBe(true)
		})

		it(`a mixin call, which this syntax hands over as an at-rule named for the class`, () => {
			expect(closingALessBlock(`.b()`)).toBe(false)
		})

		it(`a mixin call spelled without parentheses`, () => {
			expect(closingALessBlock(`.b`)).toBe(false)
		})

		it(`a mixin call carrying an important flag`, () => {
			expect(closingALessBlock(`.b() !important`)).toBe(false)
		})

		it(`a declaration, whose semicolon Less parts with`, () => {
			expect(closingALessBlock(`color: pink`)).toBe(false)
		})
	})
})
