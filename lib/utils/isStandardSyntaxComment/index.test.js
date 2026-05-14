import { parse as parseCss } from "postcss"
import { parse as parseLess } from "postcss-less"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { isStandardSyntaxComment } from "./index.js"

describe(`isStandardSyntaxComment`, () => {
	it(`standard single-line comment`, () => {
		expect(isStandardSyntaxComment(css(`/* foo */`))).toBe(true)
	})

	it(`standard multi-line comment`, () => {
		expect(isStandardSyntaxComment(css(`/*\n foo \n*/`))).toBe(true)
	})

	it(`LESS inline comment`, () => {
		expect(isStandardSyntaxComment(less(`// foo`))).toBe(false)
	})

	it(`SCSS inline comment`, () => {
		expect(isStandardSyntaxComment(scss(`// foo`))).toBe(false)
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
