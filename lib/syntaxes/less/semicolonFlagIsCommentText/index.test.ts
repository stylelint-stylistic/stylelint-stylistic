import type { Container, Parser } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { semicolonFlagIsCommentText } from "./index.ts"

/**
 * Asks about the last node of the one block of a stylesheet.
 * @param code - The node closing the block, spelled inside it.
 * @param syntax - The syntax the stylesheet is parsed with.
 * @returns What the util makes of that node.
 */
function closing (code: string, syntax: { parse: Parser } = less): boolean {
	let block = syntax.parse(`a {\n\t${code}\n}`, { from: undefined }).first as Container
	let node = block.last

	if (!node) throw new Error(`The block holds no node`)

	return semicolonFlagIsCommentText(node, { opts: { syntax } } as unknown as PostcssResult)
}

describe(`semicolonFlagIsCommentText`, () => {
	it(`a declaration of an ordinary property, a mixin call and a detached ruleset call, the semicolon in the text of the comment behind each`, () => {
		expect(closing(`color: pink // ;`)).toBe(true)
		expect(closing(`color: pink !important // ;`)).toBe(true)
		expect(closing(`.m() // ;`)).toBe(true)
		expect(closing(`@dr() // ;`)).toBe(true)
	})

	it(`a custom property, a variable and an at-rule, which Less may read to the semicolon with a reader that knows no double slash`, () => {
		expect(closing(`--x: pink // ;`)).toBe(false)
		expect(closing(`@v: pink // ;`)).toBe(false)
		expect(closing(`@extend .b // ;`)).toBe(false)
		expect(closing(`@dr$() // ;`)).toBe(false)
	})

	it(`a semicolon of code, behind the line break closing the comment, behind a double slash of an address or with no comment at all, and a comment with no semicolon behind it`, () => {
		expect(closing(`color: pink // c\n;`)).toBe(false)
		expect(closing(`background: url(//a) ;`)).toBe(false)
		expect(closing(`color: pink;`)).toBe(false)
		expect(closing(`color: pink // c`)).toBe(false)
	})

	it(`the same comment read by a parser that cuts it out of the node itself`, () => {
		expect(closing(`color: pink // ;`, scss)).toBe(false)
		expect(closing(`color: pink // c\f;`, scss)).toBe(false)
	})
})
