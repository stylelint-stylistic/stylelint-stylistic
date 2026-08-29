import postcss from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { declarationColonSource } from "./index.ts"

/**
 * Reads the first declaration of a stylesheet and builds the text a rule reads behind its colon.
 * @param {{ parse: import('postcss').Parser }} parser - The parser to read the stylesheet with.
 * @param {string} css - The stylesheet, whose first rule holds the declaration.
 * @returns {string} The text.
 */
function source (parser, css) {
	let rule = /** @type {import('postcss').Rule} */ (parser.parse(css).first)

	return declarationColonSource(/** @type {import('postcss').Declaration} */ (rule.first))
}

describe(`declarationColonSource`, () => {
	it(`a value with a word of its own, whose run behind the colon PostCSS keeps in \`raws.between\``, () => {
		expect(source(postcss, `a { color:  pink; }`)).toBe(`color:  pinkxxx`)
	})

	it(`a value holding no word, whose run stays at the head of the value's raw`, () => {
		expect(source(postcss, `a { color:  !important; }`)).toBe(`color:  xxx`)
	})

	it(`a value of the same shape with a comment in it, which the flag is printed behind and the text stops in front of`, () => {
		expect(source(postcss, `a { color: /*c*/\t!important; }`)).toBe(`color: /*c*/\txxx`)
	})

	it(`a declaration with no value at all, which would end at the colon but for the sentinel`, () => {
		expect(source(postcss, `a { color:; }`)).toBe(`color:xxx`)
	})

	it(`a custom property whose whitespace PostCSS keeps no raw for`, () => {
		expect(source(postcss, `a { --b:  ; }`)).toBe(`--b:  xxx`)
	})

	it(`an inline comment under SCSS, spelled as the file spells it rather than rewritten into a block comment`, () => {
		expect(source(scss, `a { color:  //c\n!important; }`)).toBe(`color:  //c\nxxx`)
	})

	it(`the same comment under Less, where the parser reads it as the value's own word and hands the run to \`raws.between\``, () => {
		expect(source(less, `a { color:  //c\n!important; }`)).toBe(`color:  //cxxx`)
	})

	it(`a comment standing in front of the colon, which is printed as it stands`, () => {
		expect(source(postcss, `a { color/*c*/:  pink; }`)).toBe(`color/*c*/:  pinkxxx`)
	})
})
