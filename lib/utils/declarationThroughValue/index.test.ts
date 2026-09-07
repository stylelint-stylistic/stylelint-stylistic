import postcss, { type Declaration, type Parser, type Rule } from "postcss"
import less from "postcss-less"
import { describe, expect, it } from "vitest"

import { css as syntax } from "../../syntaxes/css/index.ts"

import { declarationThroughValue } from "./index.ts"

/**
 * Reads the first declaration of a stylesheet and prints it down to the end of its value.
 * @param parser - The parser to read the stylesheet with.
 * @param css - The stylesheet, whose first rule holds the declaration.
 * @returns The text.
 */
function through (parser: { parse: Parser }, css: string): string {
	let rule = parser.parse(css).first as Rule

	return declarationThroughValue(syntax, rule.first as Declaration)
}

describe(`declarationThroughValue`, () => {
	it(`a value with a word of its own, whose run behind the colon PostCSS keeps in \`raws.between\``, () => {
		expect(through(postcss, `a { color:  pink; }`)).toBe(`color:  pink`)
	})

	it(`a comment inside the value, which the raw of the value keeps and \`decl.value\` drops`, () => {
		expect(through(postcss, `a { margin: 0 /* c */ 1px; }`)).toBe(`margin: 0 /* c */ 1px`)
	})

	it(`a comment in front of the colon, which is printed as it stands`, () => {
		expect(through(postcss, `a { color/*c*/ : pink; }`)).toBe(`color/*c*/ : pink`)
	})

	it(`a flag behind the value, which is no part of the text`, () => {
		expect(through(postcss, `a { color: pink  ! important; }`)).toBe(`color: pink`)
	})

	it(`a value holding no word, whose run stays at the head of the value's raw and the flag is printed behind`, () => {
		expect(through(postcss, `a { color:  !important; }`)).toBe(`color:  `)
	})

	it(`a declaration with no value at all, which ends at the colon`, () => {
		expect(through(postcss, `a { color:; }`)).toBe(`color:`)
	})

	it(`a declaration printing nothing behind its colon, whose run the block's own raw holds and the text stops in front of`, () => {
		expect(through(postcss, `a { color:  }`)).toBe(`color:`)
	})

	it(`a custom property whose whitespace PostCSS keeps in \`decl.value\` itself`, () => {
		expect(through(postcss, `a { --b:  ; }`)).toBe(`--b:  `)
	})

	it(`a comment opened by a double slash under Less, where the parser reads it as the value's own word`, () => {
		expect(through(less, `a { color:  //c\n!important; }`)).toBe(`color:  //c`)
	})
})
