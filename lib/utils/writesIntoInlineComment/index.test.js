import { parse } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { writesIntoInlineComment } from "./index.ts"

/** Plain CSS as a syntax object, since a syntax object is what a rule is handed for the file it reads. */
const PLAIN_CSS = { parse }

/**
 * Parses a stylesheet and asks the question about one of its nodes.
 * @param {{ parse: import('postcss').Parser }} syntax - The syntax to parse the stylesheet with.
 * @param {string} code - The stylesheet.
 * @param {(root: import('postcss').Root | import('postcss').Document) => import('postcss').Node | undefined} pick - Which node of it to ask about.
 * @param {string} [spelledBetween] - The run the fix would leave standing between that node and the write.
 * @returns {boolean} What the utility answers.
 */
function ask (syntax, code, pick, spelledBetween) {
	let root = syntax.parse(code, { from: undefined })
	let node = pick(root)

	if (!node) throw new Error(`The case picks no node`)

	return writesIntoInlineComment(node, /** @type {import('stylelint').PostcssResult} */ (/** @type {unknown} */ ({ opts: { syntax } })), spelledBetween)
}

/**
 * The first statement of a stylesheet, read as the container the cases pick a node out of.
 * @param {import('postcss').Root | import('postcss').Document} root - The parsed stylesheet.
 * @returns {import('postcss').Container} That statement.
 */
function block (root) {
	return /** @type {import('postcss').Container} */ (root.first)
}

describe(`writesIntoInlineComment`, () => {
	it(`a declaration whose value ends with an inline comment`, () => {
		expect(ask(scss, `a {\n\tcolor: red // c\n\t;\n}`, (root) => block(root).first)).toBe(true)
	})

	it(`the same declaration under a syntax that leaves the comment standing in the value`, () => {
		expect(ask(less, `a {\n\tcolor: red // c\n\t;\n}`, (root) => block(root).first)).toBe(true)
	})

	it(`a flag Less reads out of the text of a comment, which the raw holding that flag does not show on its own`, () => {
		expect(ask(less, `a {\n\tcolor: red // c !important\n\t;\n}`, (root) => block(root).first)).toBe(true)
	})

	it(`a comment the flag stands on the next line from, so the write goes behind the flag instead`, () => {
		expect(ask(scss, `a {\n\tcolor: red // c\n\t\t!important\n\t;\n}`, (root) => block(root).first)).toBe(false)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/333
	it(`a form feed standing in the middle of the value, which is whitespace and closes no comment under either syntax`, () => {
		expect(ask(scss, `a {\n\tcolor: red // c\f2px\n\t;\n}`, (root) => block(root).first)).toBe(true)
		expect(ask(less, `a {\n\tcolor: red // c\f2px\n\t;\n}`, (root) => block(root).first)).toBe(true)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/333
	it(`a form feed the value ends with, which is whitespace the comment holds and the very whitespace the write goes into, under either syntax`, () => {
		expect(ask(scss, `a {\n\tcolor: red // c\f;\n\ttop: 0;\n}`, (root) => block(root).first)).toBe(true)
		expect(ask(less, `a {\n\tcolor: red // c\f;\n\ttop: 0;\n}`, (root) => block(root).first)).toBe(true)
	})

	it(`the same declaration in plain CSS, where a double slash spells no comment at all`, () => {
		expect(ask(PLAIN_CSS, `a {\n\tcolor: red // c\n\t;\n}`, (root) => block(root).first)).toBe(false)
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
		expect(ask(scss, `a {\n\tcolor: red;\n\t// c\n}`, (root) => block(root).last)).toBe(true)
	})

	it(`the same comment under a syntax that flags it on the node rather than in its raws`, () => {
		expect(ask(less, `a {\n\tcolor: red;\n\t// c\n}`, (root) => block(root).last)).toBe(true)
	})

	it(`a block comment, which its own text closes`, () => {
		expect(ask(scss, `a {\n\t/* c */\n}`, (root) => block(root).first)).toBe(false)
	})

	it(`a declaration ending in the break that closes its own comment, asked with the semicolon that stands behind that break`, () => {
		expect(ask(scss, `a {\n\tcolor: red // c\n\t;\n\ttop: 0;\n}`, (root) => block(root).first, `;`)).toBe(false)
	})

	it(`the same declaration and the same semicolon under a syntax that leaves the comment standing in the value`, () => {
		expect(ask(less, `a {\n\tcolor: red // c\n\t;\n\ttop: 0;\n}`, (root) => block(root).first, `;`)).toBe(false)
	})

	it(`a flag Less reads out of the text of a comment, where the semicolon behind it stands inside that comment too`, () => {
		expect(ask(less, `a {\n\tcolor: red // c !important;\n\ttop: 0;\n}`, (root) => block(root).first, `;`)).toBe(true)
	})

	it(`an inline comment of its own, which nothing a caller spells behind it closes`, () => {
		expect(ask(scss, `a {\n\tcolor: red;\n\t// c\n\ttop: 0;\n}`, (root) => block(root).first?.next(), `;`)).toBe(true)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/231
	// Every case below spells out the run the fix leaves standing, so nothing of it — the whitespace the node ends with included — is read as room the write goes into.
	it(`a declaration whose own trailing whitespace holds the break that closes the comment`, () => {
		expect(ask(scss, `a {\n\tcolor: red // c\n\t;\n}`, (root) => block(root).first, ``)).toBe(false)
	})

	it(`the same trailing whitespace under a syntax that leaves the comment standing in the value`, () => {
		expect(ask(less, `a {\n\tcolor: red // c\n\t;\n}`, (root) => block(root).first, ``)).toBe(false)
	})

	it(`a value the comment is open at the end of, with a run holding no break behind it`, () => {
		expect(ask(less, `a {\n\tcolor: red // c\n}`, (root) => block(root).first, ``)).toBe(true)
	})

	it(`the same value, with a break standing in the run itself`, () => {
		expect(ask(less, `a {\n\tcolor: red // c\n}`, (root) => block(root).first, `\n`)).toBe(false)
	})

	it(`an inline comment of its own, closed by a break the run holds`, () => {
		expect(ask(scss, `a {\n\tcolor: red;\n\t// c\n}`, (root) => block(root).last, `\n;`)).toBe(false)
	})

	it(`a bodiless at-rule whose break stands in the raw behind its parameters, which the run does not reach`, () => {
		expect(ask(scss, `a {\n\t@extend .b // c\n}`, (root) => block(root).first, ``)).toBe(false)
	})
})
