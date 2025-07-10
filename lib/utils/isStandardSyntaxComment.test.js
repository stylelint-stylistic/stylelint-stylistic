import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { parse as parseCss } from "postcss"
import { parse as parseLess } from "postcss-less"
import { parse as parseScss } from "postcss-scss"

import { isStandardSyntaxComment } from "./isStandardSyntaxComment.js"

describe(`isStandardSyntaxComment`, () => {
	it(`standard single-line comment`, () => {
		equal(isStandardSyntaxComment(css(`/* foo */`)), true)
	})

	it(`standard multi-line comment`, () => {
		equal(isStandardSyntaxComment(css(`/*\n foo \n*/`)), true)
	})

	it(`LESS inline comment`, () => {
		equal(isStandardSyntaxComment(less(`// foo`)), false)
	})

	it(`SCSS inline comment`, () => {
		equal(isStandardSyntaxComment(scss(`// foo`)), false)
	})
})

function css (code) {
	return parseCss(code).first
}

function less (code) {
	return parseLess(code).first
}

function scss (code) {
	return parseScss(code).first
}
