import { parse } from "postcss"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { searchCopy } from "./index.js"

describe(`searchCopy`, () => {
	it(`a double slash of plain CSS is code, and its second slash is spelled out of the search's way`, () => {
		expect(searchCopy(`myurl(//a)red`, cssDecl(`a { b: myurl(//a)red }`), CSS_RESULT).searchString).toBe(`myurl(/?a)red`)
	})

	it(`a double slash inside an address is spelled out of the way whatever the syntax`, () => {
		expect(searchCopy(`url(http://x)red`, scssDecl(`a { b: url(http://x)red }`), SCSS_RESULT).searchString).toBe(`url(http:/?x)red`)
	})

	it(`a comment this syntax does spell is blanked, and the break closing it left standing`, () => {
		expect(searchCopy(`1px // c\n  2px`, scssDecl(`a { b: 1px // c\n  2px }`), SCSS_RESULT).searchString).toBe(`1px     \n  2px`)
	})

	it(`the pair two block comments spell between them opens nothing, and both comments are blanked`, () => {
		expect(searchCopy(`1px/*x*//*y*/2px`, cssDecl(`a { b: 1px/*x*//*y*/2px }`), CSS_RESULT).searchString).toBe(`1px          2px`)
	})

	it(`the second slash of plain CSS opens a block comment where a star follows it`, () => {
		expect(searchCopy(`1px//*c*/2px`, cssDecl(`a { b: 1px//*c*/2px }`), CSS_RESULT).searchString).toBe(`1px/     2px`)
	})

	it(`the spans the copy was built from come back with it`, () => {
		expect(searchCopy(`1px // c\n  2px`, scssDecl(`a { b: 1px // c\n  2px }`), SCSS_RESULT).commentSpans).toEqual([{ start: 4, end: 8, isInline: true }])
	})

	it(`a text a syntax spells no comment in has no span to report`, () => {
		expect(searchCopy(`myurl(//a)red`, cssDecl(`a { b: myurl(//a)red }`), CSS_RESULT).commentSpans).toEqual([])
	})

	it(`the copy is as long as the text it was made of, so every position stands where it did`, () => {
		for (let text of [`myurl(//a)red`, `1px/*x*//*y*/2px`, `1px//*c*/2px`]) {
			expect(searchCopy(text, cssDecl(`a { b: ${text} }`), CSS_RESULT).searchString).toHaveLength(text.length)
		}
	})
})

const CSS_RESULT = /** @type {import('stylelint').PostcssResult} */ (/** @type {unknown} */ ({ opts: {} }))
const SCSS_RESULT = /** @type {import('stylelint').PostcssResult} */ (/** @type {unknown} */ ({ opts: { syntax: { parse: parseScss } } }))

/**
 * Reads the first declaration of a stylesheet.
 * @param {string} css - The stylesheet.
 * @returns {import('postcss').Declaration} That declaration.
 */
function cssDecl (css) {
	/** @type {import('postcss').Declaration[]} */
	let list = []

	parse(css).walkDecls((d) => {
		list.push(d)
	})

	return list[0]
}

/**
 * Reads the first declaration of a stylesheet written in SCSS.
 * @param {string} css - The stylesheet.
 * @returns {import('postcss').Declaration} That declaration.
 */
function scssDecl (css) {
	/** @type {import('postcss').Declaration[]} */
	let list = []

	parseScss(css).walkDecls((d) => {
		list.push(d)
	})

	return list[0]
}
