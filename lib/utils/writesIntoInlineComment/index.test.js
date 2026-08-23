import { parse } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { writesIntoInlineComment } from "./index.js"

/** Plain CSS as a syntax object, since a syntax object is what a rule is handed for the file it reads. */
const PLAIN_CSS = { parse }

/**
 * Parses a stylesheet and asks the question about one of its nodes.
 * @param {{ parse: Function }} syntax - The syntax to parse the stylesheet with.
 * @param {string} code - The stylesheet.
 * @param {(root: import('postcss').Root) => import('postcss').Node} pick - Which node of it to ask about.
 * @returns {boolean} What the utility answers.
 */
function ask (syntax, code, pick) {
	let root = syntax.parse(code, { from: undefined })

	return writesIntoInlineComment(pick(root), { opts: { syntax } })
}

describe(`writesIntoInlineComment`, () => {
	it(`a declaration whose value ends with an inline comment`, () => {
		expect(ask(scss, `a {\n\tcolor: red // c\n\t;\n}`, (root) => root.first.first)).toBe(true)
	})

	it(`the same declaration under a syntax that leaves the comment standing in the value`, () => {
		expect(ask(less, `a {\n\tcolor: red // c\n\t;\n}`, (root) => root.first.first)).toBe(true)
	})

	it(`a flag Less reads out of the text of a comment, which the raw holding that flag does not show on its own`, () => {
		expect(ask(less, `a {\n\tcolor: red // c !important\n\t;\n}`, (root) => root.first.first)).toBe(true)
	})

	it(`a comment the flag stands on the next line from, so the write goes behind the flag instead`, () => {
		expect(ask(scss, `a {\n\tcolor: red // c\n\t\t!important\n\t;\n}`, (root) => root.first.first)).toBe(false)
	})

	it(`the same declaration in plain CSS, where a double slash spells no comment at all`, () => {
		expect(ask(PLAIN_CSS, `a {\n\tcolor: red // c\n\t;\n}`, (root) => root.first.first)).toBe(false)
	})

	it(`an at-rule with no block, whose parameters end with an inline comment`, () => {
		expect(ask(less, `@foo bar // c\n;`, (root) => root.first)).toBe(true)
	})

	it(`the same at-rule under a syntax that files the comment behind the parameters`, () => {
		expect(ask(scss, `@foo bar // c\n;`, (root) => root.first)).toBe(true)
	})

	it(`an at-rule carrying a block, which ends with the closing brace of that block however its head is spelled`, () => {
		expect(ask(scss, `@media screen // c\n{\n\ta { color: red; }\n}`, (root) => root.first)).toBe(false)
	})

	it(`a rule, which ends with a closing brace of its own`, () => {
		expect(ask(scss, `a {\n\t// c\n}`, (root) => root.first)).toBe(false)
	})

	it(`an inline comment of its own, which the syntax has already read as one`, () => {
		expect(ask(scss, `a {\n\tcolor: red;\n\t// c\n}`, (root) => root.first.last)).toBe(true)
	})

	it(`the same comment under a syntax that flags it on the node rather than in its raws`, () => {
		expect(ask(less, `a {\n\tcolor: red;\n\t// c\n}`, (root) => root.first.last)).toBe(true)
	})

	it(`a block comment, which its own text closes`, () => {
		expect(ask(scss, `a {\n\t/* c */\n}`, (root) => root.first.first)).toBe(false)
	})
})
