import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { parse } from "postcss"

import blockString from "./blockString.js"

describe(`blockString`, () => {
	it(`rules`, () => {
		equal(postcssCheck(`a { color: pink; }`), `{ color: pink; }`)
		equal(postcssCheck(`a {\n\tcolor: pink;\n\ttop: 0;\n}`), `{\n\tcolor: pink;\n\ttop: 0;\n}`)
	})

	it(`at-rules`, () => {
		equal(postcssCheck(`@media print { a { color: pink; } }`), `{ a { color: pink; } }`)
		equal(postcssCheck(`@keyframes foo {\n  0% {\n  top: 0;\n}\n\n  100% {\n  top: 10px;\n}\n}\n`), `{\n  0% {\n  top: 0;\n}\n\n  100% {\n  top: 10px;\n}\n}`)
	})

	it(`no block`, () => {
		equal(postcssCheck(`@import url(foo.css);`), ``)
	})
})

function postcssCheck (cssString) {
	const root = parse(cssString)

	return blockString(root.first)
}
