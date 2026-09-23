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
	it(`a declaration of an ordinary property, its important flag included, a mixin call and a detached ruleset call, the semicolon in the text of the comment behind each`, () => {
		expect(closing(`color: pink // ;`)).toBe(true)
		expect(closing(`color: pink !important // ;`)).toBe(true)
		expect(closing(`.m() // ;`)).toBe(true)
		expect(closing(`@dr() // ;`)).toBe(true)
	})

	it(`a custom property behind a bare entity Less's comment-and-entity loop consumes whole — a word, a string, a bracketed group, a call, a call nested in a call's argument list, a call carrying a parenthesis inside a quoted argument — a string holding an important-looking flag among them, and one behind an important-looking flag in the comment rather than the value`, () => {
		expect(closing(`--x: pink // ;`)).toBe(true)
		expect(closing(`--x: "s" // ;`)).toBe(true)
		expect(closing(`--x: [a] // ;`)).toBe(true)
		expect(closing(`--x: f(x) // ;`)).toBe(true)
		expect(closing(`--x: calc(var(--y)) // ;`)).toBe(true)
		expect(closing(`--x: f("(") // ;`)).toBe(true)
		expect(closing(`--x: "! important" // ;`)).toBe(true)
		expect(closing(`--x: pink // note !important here ;`)).toBe(true)
	})

	it(`a custom property behind anything that loop cannot consume whole — an important flag, a bare parenthesised group, a bracketed group nesting another, an assignment, a division, a brace — a variable and an at-rule, which Less may read to the semicolon with a reader that knows no double slash`, () => {
		expect(closing(`--x: pink !important // ;`)).toBe(false)
		expect(closing(`--x: (a) // ;`)).toBe(false)
		expect(closing(`--x: [[a]] // ;`)).toBe(false)
		expect(closing(`--x: a=b // ;`)).toBe(false)
		expect(closing(`--x: 1 / 2 // ;`)).toBe(false)
		expect(closing(`--x: {a} // ;`)).toBe(false)
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
