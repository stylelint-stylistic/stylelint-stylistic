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

/**
 * Reads the first node of a stylesheet, which the cases spell as a comment.
 * @param {string} code - The stylesheet.
 * @returns {import('postcss').Comment} That comment.
 */
function css (code) {
	return /** @type {import('postcss').Comment} */ (parseCss(code).first)
}

/**
 * Reads the first node of a stylesheet written in Less, which the cases spell as a comment.
 * @param {string} code - The stylesheet.
 * @returns {import('postcss').Comment} That comment.
 */
function less (code) {
	return /** @type {import('postcss').Comment} */ (parseLess(code).first)
}

/**
 * Reads the first node of a stylesheet written in SCSS, which the cases spell as a comment.
 * @param {string} code - The stylesheet.
 * @returns {import('postcss').Comment} That comment.
 */
function scss (code) {
	return /** @type {import('postcss').Comment} */ (parseScss(code).first)
}
