import postcss, { parse } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { nodeString } from "./index.ts"

describe(`nodeString`, () => {
	it(`prints a declaration with no comment in the value`, () => {
		expect(first(postcss, `a { color: pink }`, `decl`)).toBe(`color: pink`)
	})

	it(`prints a declaration with a bang`, () => {
		expect(first(postcss, `a { color: pink !important }`, `decl`)).toBe(`color: pink !important`)
	})

	it(`prints a declaration with a bang spelled its own way`, () => {
		expect(first(postcss, `a { color: pink  ! important }`, `decl`)).toBe(`color: pink  ! important`)
	})

	it(`prints a declaration with a comment inside the value`, () => {
		expect(first(postcss, `a { margin: 0 /* c */ 1px }`, `decl`)).toBe(`margin: 0 /* c */ 1px`)
	})

	it(`prints a declaration whose value holds the comment the syntax keeps a second copy of`, () => {
		expect(first(scss, `a { margin: 0 // c\n  1px !important }`, `decl`)).toBe(`margin: 0 // c\n  1px !important`)
	})

	it(`prints a set of parameters holding such a comment`, () => {
		expect(first(scss, `@import "a" // c\n\t"b";\n`, `atrule`)).toBe(`@import "a" // c\n\t"b"`)
	})

	it(`prints a selector holding such a comment`, () => {
		expect(first(scss, `a // c\n{ color: pink; }\n`, `rule`)).toBe(`a // c\n{ color: pink; }`)
	})

	it(`prints a comment opened by a double slash`, () => {
		expect(first(scss, `// c\na {}\n`, `comment`)).toBe(`// c`)
	})

	it(`prints such a comment under Less, where it is two characters narrower than a block one`, () => {
		expect(first(less, `// c\na {}\n`, `comment`)).toBe(`// c`)
	})

	it(`prints a Less mixin call, whose leading dot the syntax keeps in a raw`, () => {
		expect(first(less, `a { .m(); }`, `atrule`)).toBe(`.m()`)
	})

	it(`prints the bang of a Less mixin call, which PostCSS does not print at all`, () => {
		expect(first(less, `a { .m() !important; }`, `atrule`)).toBe(`.m() !important`)
	})

	it(`falls back to PostCSS's own stringifier where no syntax is to be had`, () => {
		let root = parse(`a { color: pink }`)

		expect(nodeString(/** @type {import('postcss').Rule} */ (root.first))).toBe(`a { color: pink }`)
	})
})

/**
 * Parses a stylesheet and prints the first node of the type asked for.
 * @param {{ parse: import('postcss').Parser }} syntax - The syntax to read the stylesheet with, and to print the node back with.
 * @param {string} css - The stylesheet.
 * @param {string} type - The type of the node to print.
 * @returns {string} That node, as `nodeString` prints it.
 */
function first (syntax, css, type) {
	let root = syntax.parse(css, { from: undefined })

	/** @type {import('postcss').Node | undefined} */
	let found

	root.walk((node) => {
		if (found === undefined && node.type === type) found = node
	})

	if (!found) throw new Error(`The stylesheet holds no node of the type "${type}"`)

	return nodeString(found, /** @type {import('stylelint').PostcssResult} */ (/** @type {unknown} */ ({ opts: { syntax } })))
}
