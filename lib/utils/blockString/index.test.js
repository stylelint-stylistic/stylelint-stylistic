import postcss from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { blockString } from "./index.js"

describe(`blockString`, () => {
	it(`rules`, () => {
		expect(postcssCheck(`a { color: pink; }`)).toBe(`{ color: pink; }`)
		expect(postcssCheck(`a {\n\tcolor: pink;\n\ttop: 0;\n}`)).toBe(`{\n\tcolor: pink;\n\ttop: 0;\n}`)
	})

	it(`at-rules`, () => {
		expect(postcssCheck(`@media print { a { color: pink; } }`)).toBe(`{ a { color: pink; } }`)
		expect(postcssCheck(`@keyframes foo {\n  0% {\n  top: 0;\n}\n\n  100% {\n  top: 10px;\n}\n}\n`)).toBe(`{\n  0% {\n  top: 0;\n}\n\n  100% {\n  top: 10px;\n}\n}`)
	})

	it(`no block`, () => {
		expect(postcssCheck(`@import url(foo.css);`)).toBe(``)
	})

	it(`a block whose selector an inline comment stands behind, which this syntax files in the raw standing in front of the brace`, () => {
		expect(postcssCheck(`a // c\n{ color: pink; }`, scss)).toBe(`{ color: pink; }`)
	})

	it(`a block whose selector holds an inline comment inside it, which the syntax keeps a second copy of`, () => {
		expect(postcssCheck(`a, // c\nb { color: pink; }`, scss)).toBe(`{ color: pink; }`)
	})

	it(`a block ending in an inline comment, two characters narrower than the block comment PostCSS prints`, () => {
		expect(postcssCheck(`a {\n\tcolor: pink;\n\t// c\n}`, less)).toBe(`{\n\tcolor: pink;\n\t// c\n}`)
	})

	it(`a block ending in a Less mixin call, whose leading dot the syntax keeps in a raw`, () => {
		expect(postcssCheck(`a { .m(); }`, less)).toBe(`{ .m(); }`)
	})
})

/**
 * Reads the first statement of a stylesheet and hands back its block.
 * @param {string} cssString - The stylesheet.
 * @param {{ parse: import('postcss').Parser }} [syntax] - The syntax to read it with.
 * @returns {string} What the util answers.
 */
function postcssCheck (cssString, syntax = postcss) {
	let root = syntax.parse(cssString, { from: undefined })

	return blockString(/** @type {import('postcss').Container} */ (root.first), /** @type {import('stylelint').PostcssResult} */ (/** @type {unknown} */ ({ opts: { syntax } })))
}
