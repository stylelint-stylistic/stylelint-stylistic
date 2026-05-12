import { parse } from "postcss"
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
})

function postcssCheck (cssString) {
	let root = parse(cssString)

	return blockString(root.first)
}
