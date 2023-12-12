import { it } from "node:test"
import { equal } from "node:assert/strict"

import { parse } from "postcss"

import hasEmptyBlock from "../hasEmptyBlock.js"

it(`hasEmptyBlock`, () => {
	equal(postcssCheck(`a {}`), true)
	equal(postcssCheck(`a { }`), true)
	equal(postcssCheck(`a {\n}`), true)
	equal(postcssCheck(`@media print {}`), true)
	equal(postcssCheck(`@supports (animation-name: test) {}`), true)
	equal(postcssCheck(`@document url(http://www.w3.org/) {}`), true)
	equal(postcssCheck(`@page :pseudo-class {}`), true)
	equal(postcssCheck(`@font-face {}`), true)
	equal(postcssCheck(`@keyframes identifier {}`), true)

	equal(postcssCheck(`a { color: pink; }`), false)
	equal(postcssCheck(`@media print { a { color: pink; } }`), false)
	equal(postcssCheck(`@supports (animation-name: test) { a { color: pink; } }`), false)
	equal(postcssCheck(`@document url(http://www.w3.org/) { a { color: pink; } }`), false)
	equal(postcssCheck(`@page :pseudo-class { a { color: pink; } }`), false)
	equal(postcssCheck(`@font-face { font-family: sans; }`), false)
	equal(postcssCheck(`@keyframes identifier { 0% { top: 0; left:} }`), false)
	equal(postcssCheck(`@import url(x.css)`), false)
	equal(postcssCheck(`@import 'x.css'`), false)
	equal(postcssCheck(`@import "x.css"`), false)
	equal(postcssCheck(`@charset "UTF-8"`), false)
	equal(postcssCheck(`@namespace url(http://www.w3.org/1999/xhtml)`), false)
	equal(postcssCheck(`@namespace svg url(http://www.w3.org/2000/svg)`), false)
})

function postcssCheck (cssString) {
	const root = parse(cssString)

	return hasEmptyBlock(root.first)
}
