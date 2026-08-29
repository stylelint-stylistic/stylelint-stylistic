import postcss from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { getDeclarationValue } from "../getDeclarationValue/index.js"

import { moveDeclarationValueHeadIntoBetween } from "./index.ts"

/**
 * Reads the first declaration of a stylesheet, moves the head of its value, and says what came of it.
 * @param {{ parse: import('postcss').Parser }} parser - The parser to read the stylesheet with.
 * @param {string} css - The stylesheet, whose first rule holds the declaration.
 * @param {number} length - How many characters of the printed value to move.
 * @returns {{ printed: string, value: string, between: string | undefined }} What the file prints, what the value now reads as, and what stands between the property and it.
 */
function move (parser, css, length) {
	let rule = /** @type {import('postcss').Rule} */ (parser.parse(css).first)
	let decl = /** @type {import('postcss').Declaration} */ (rule.first)

	moveDeclarationValueHeadIntoBetween(decl, length)

	return { printed: rule.root().toResult({ syntax: parser }).css, value: getDeclarationValue(decl), between: decl.raws.between }
}

describe(`moveDeclarationValueHeadIntoBetween`, () => {
	it(`the whitespace at the head of a value that holds a comment behind it`, () => {
		expect(move(postcss, `a { b:  /*c*/ ; }`, 2)).toEqual({ printed: `a { b:  /*c*/ ; }`, value: `/*c*/ `, between: `:  ` })
	})

	it(`the whole of a value that is nothing but whitespace: the raw goes with the head, and the value is emptied to match`, () => {
		expect(move(postcss, `a { b:  ; }`, 2)).toEqual({ printed: `a { b:  ; }`, value: ``, between: `:  ` })
	})

	it(`the whole of a value that is a comment and the whitespace in front of it, which leaves the value holding no word of its own`, () => {
		expect(move(postcss, `a { b: /*c*/; }`, 6)).toEqual({ printed: `a { b: /*c*/; }`, value: ``, between: `: /*c*/` })
	})

	it(`the same whole value on a custom property, which PostCSS reads exactly as it reads the ordinary one`, () => {
		expect(move(postcss, `a { --b: /*c*/; }`, 6)).toEqual({ printed: `a { --b: /*c*/; }`, value: ``, between: `: /*c*/` })
	})

	it(`the whole of a custom property's value, which PostCSS keeps no raw beside at all`, () => {
		expect(move(postcss, `a { --b:  ; }`, 2)).toEqual({ printed: `a { --b:  ; }`, value: ``, between: `:  ` })
	})

	it(`the whitespace in front of an inline comment under SCSS, which is all that reaches \`raws.between\`, the comment staying in the value`, () => {
		expect(move(scss, `a { b:  //c\n!important; }`, 2)).toEqual({ printed: `a { b:  //c\n!important; }`, value: `//c\n`, between: `:  ` })
	})

	it(`the whole of that same value, comment and all`, () => {
		expect(move(scss, `a { b:  //c\n!important; }`, 6)).toEqual({ printed: `a { b:  //c\n!important; }`, value: ``, between: `:  //c\n` })
	})

	it(`the whole of a value under Less, where the flag stands behind it`, () => {
		expect(move(less, `a { b:  !important; }`, 2)).toEqual({ printed: `a { b:  !important; }`, value: ``, between: `:  ` })
	})
})
