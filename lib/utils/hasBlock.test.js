import { equal } from "node:assert/strict"
import { it } from "node:test"

import { parse } from "postcss"

import { hasBlock } from "./hasBlock.js"

it(`hasBlock`, () => {
	equal(postcssCheck(`a {}`), true)
	equal(postcssCheck(`a { }`), true)
	equal(postcssCheck(`a {\n}`), true)
	equal(postcssCheck(`@media print {}`), true)
	equal(postcssCheck(`@supports (animation-name: test) {}`), true)
	equal(postcssCheck(`@document url(http://www.w3.org/) {}`), true)
	equal(postcssCheck(`@page :pseudo-class {}`), true)
	equal(postcssCheck(`@font-face {}`), true)
	equal(postcssCheck(`@keyframes identifier {}`), true)

	equal(postcssCheck(`a { color: pink; }`), true)
	equal(postcssCheck(`@media print { a { color: pink; } }`), true)
	equal(postcssCheck(`@supports (animation-name: test) { a { color: pink; } }`), true)
	equal(postcssCheck(`@document url(http://www.w3.org/) { a { color: pink; } }`), true)
	equal(postcssCheck(`@page :pseudo-class { a { color: pink; } }`), true)
	equal(postcssCheck(`@font-face { font-family: sans; }`), true)
	equal(postcssCheck(`@keyframes identifier { 0% { top: 0; left:} }`), true)

	equal(postcssCheck(`@import url(x.css)`), false)
	equal(postcssCheck(`@import 'x.css'`), false)
	equal(postcssCheck(`@import "x.css"`), false)
	equal(postcssCheck(`@charset "UTF-8"`), false)
	equal(postcssCheck(`@namespace url(http://www.w3.org/1999/xhtml)`), false)
	equal(postcssCheck(`@namespace svg url(http://www.w3.org/2000/svg)`), false)
})

function postcssCheck (cssString) {
	let root = parse(cssString)

	return hasBlock(root.first)
}
