import { parse } from "postcss"
import { expect, it } from "vitest"

import { hasEmptyBlock } from "./index.js"

it(`hasEmptyBlock`, () => {
	expect(postcssCheck(`a {}`)).toBe(true)
	expect(postcssCheck(`a { }`)).toBe(true)
	expect(postcssCheck(`a {\n}`)).toBe(true)
	expect(postcssCheck(`@media print {}`)).toBe(true)
	expect(postcssCheck(`@supports (animation-name: test) {}`)).toBe(true)
	expect(postcssCheck(`@document url(http://www.w3.org/) {}`)).toBe(true)
	expect(postcssCheck(`@page :pseudo-class {}`)).toBe(true)
	expect(postcssCheck(`@font-face {}`)).toBe(true)
	expect(postcssCheck(`@keyframes identifier {}`)).toBe(true)

	expect(postcssCheck(`a { color: pink; }`)).toBe(false)
	expect(postcssCheck(`@media print { a { color: pink; } }`)).toBe(false)
	expect(postcssCheck(`@supports (animation-name: test) { a { color: pink; } }`)).toBe(false)
	expect(postcssCheck(`@document url(http://www.w3.org/) { a { color: pink; } }`)).toBe(false)
	expect(postcssCheck(`@page :pseudo-class { a { color: pink; } }`)).toBe(false)
	expect(postcssCheck(`@font-face { font-family: sans; }`)).toBe(false)
	expect(postcssCheck(`@keyframes identifier { 0% { top: 0; left:} }`)).toBe(false)
	expect(postcssCheck(`@import url(x.css)`)).toBe(false)
	expect(postcssCheck(`@import 'x.css'`)).toBe(false)
	expect(postcssCheck(`@import "x.css"`)).toBe(false)
	expect(postcssCheck(`@charset "UTF-8"`)).toBe(false)
	expect(postcssCheck(`@namespace url(http://www.w3.org/1999/xhtml)`)).toBe(false)
	expect(postcssCheck(`@namespace svg url(http://www.w3.org/2000/svg)`)).toBe(false)
})

function postcssCheck (cssString) {
	let root = parse(cssString)

	return hasEmptyBlock(root.first)
}
