import { type Declaration, parse } from "postcss"
import scssSyntax, { parse as scssParse } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { colonIndexInBetween } from "./index.ts"

/** The least of a Stylelint result, which names no syntax, so that the file is read as plain CSS. */
const RESULT = {} as unknown as PostcssResult

/** The least of a Stylelint result naming the syntax an SCSS file is opened with, whose own tokenizer reads a double slash as the opening of a comment. The reading turns on the syntax the file was opened with rather than on the namespace the rule is built over, so the core's adapter is what every case asks. */
const SCSS_RESULT = { opts: { syntax: scssSyntax } } as unknown as PostcssResult

/**
 * Parses one declaration out of a block.
 * @param block - The block to parse.
 * @returns Its first declaration.
 */
function declarationOf (block: string): Declaration {
	let decl: Declaration | undefined

	parse(block).walkDecls((found) => {
		decl ??= found
	})

	if (!decl) throw new Error(`The block holds no declaration`)

	return decl
}

/**
 * Parses one declaration out of a block written in SCSS.
 * @param block - The block to parse.
 * @returns Its first declaration.
 */
function scssDeclarationOf (block: string): Declaration {
	let decl: Declaration | undefined

	scssParse(block).walkDecls((found) => {
		decl ??= found
	})

	if (!decl) throw new Error(`The block holds no declaration`)

	return decl
}

/**
 * Finds the colon of the first declaration of a block, read as plain CSS.
 * @param block - The block.
 * @returns The index of the colon in `raws.between`.
 */
function colonOf (block: string): number {
	return colonIndexInBetween(css, declarationOf(block), RESULT)
}

describe(`colonIndexInBetween`, () => {
	it(`the parser's own layouts: a bare colon, and one with whitespace on either side`, () => {
		expect(colonOf(`a { b:x; }`)).toBe(0)
		expect(colonOf(`a { b : x; }`)).toBe(1)
		expect(colonOf(`a { b\n:\nx; }`)).toBe(1)
	})

	it(`a colon a comment of the between spells is not the declaration's, whether the comment stands in front of the colon or behind it`, () => {
		expect(colonOf(`a { b/*x:y*/:  x; }`)).toBe(7)
		expect(colonOf(`a { b:\n/*x:y*/ x; }`)).toBe(0)
	})

	it(`a double slash in front of the colon, which opens a comment where the syntax's own tokenizer reads one and is code where it does not`, () => {
		expect(colonIndexInBetween(css, scssDeclarationOf(`a { b //x:y\n: red; }`), SCSS_RESULT)).toBe(7)
		expect(colonIndexInBetween(css, declarationOf(`a { b //: red; }`), RESULT)).toBe(3)
	})

	it(`a colon inside a string standing in front of the colon is the string's`, () => {
		expect(colonOf(`a { b "x:" : x; }`)).toBe(6)
	})

	it(`a comment whose text ends in a backslash, which closes on the first delimiter behind its opening as it does to PostCSS`, () => {
		expect(colonOf(`a { b/*x\\*/: x; }`)).toBe(6)
		expect(colonOf(`a { b/*x:\\*/:x; }`)).toBe(7)
	})

	it(`two comments abutting, whose closing and opening delimiters spell a double slash between them that opens nothing`, () => {
		expect(colonOf(`a { b/*x*//*y:*/: x; }`)).toBe(11)
	})

	it(`a backslash in front of the opening slash, which escapes nothing to PostCSS, so the comment is one and its colon the comment's`, () => {
		expect(colonOf(`a { b \\/*x:y*/: x; }`)).toBe(9)
		expect(colonOf(`a { b \\/*x*//*y:z*/: x; }`)).toBe(14)

		expect(colonIndexInBetween(css, scssDeclarationOf(`a { b \\//x:y\n: red; }`), SCSS_RESULT)).toBe(8)
	})

	it(`a string behind a double slash in a plain CSS file, where the slashes are code and the string a string`, () => {
		expect(colonOf(`a { b //"x:": x; }`)).toBe(7)
		expect(colonOf(`a { b //'x:': x; }`)).toBe(7)
	})

	it(`an escaped quote, which opens no string, and an escaped colon, which is none of the declaration's`, () => {
		expect(colonOf(`a { b \\": x; }`)).toBe(3)
		expect(colonOf(`a { b \\:: x; }`)).toBe(3)
	})

	it(`a quote inside a string, escaped by one backslash, and one behind two, which closes the string as it does to PostCSS`, () => {
		expect(colonOf(`a { b "x\\":" : x; }`)).toBe(8)

		let decl = declarationOf(`a { b: x; }`)

		decl.raws.between = ` "x\\\\": `
		expect(colonIndexInBetween(css, decl, RESULT)).toBe(6)
	})

	it(`a double slash welded to the word in front of it, which opens no comment for either preprocessor's parser`, () => {
		expect(colonIndexInBetween(css, scssDeclarationOf(`a { b $//:  red; }`), SCSS_RESULT)).toBe(4)
		expect(colonIndexInBetween(css, declarationOf(`a { b $//:  red; }`), RESULT)).toBe(4)
	})

	it(`a group behind the address call, which the tokenizer takes whole whatever it holds, against the same group behind another word, which it takes apart on the slash inside`, () => {
		expect(colonIndexInBetween(css, declarationOf(`a { url (x/y:z): red; }`), RESULT)).toBe(8)

		let decl = declarationOf(`a { b: x; }`)

		decl.raws.between = ` (x/y:z): `
		expect(colonIndexInBetween(css, decl, RESULT)).toBe(5)
	})

	it(`the same group behind a property the parser welded a token of its own onto, where the word the group is read against is still the address call`, () => {
		expect(colonIndexInBetween(css, declarationOf(`a { url) (x/y:z): red; }`), RESULT)).toBe(8)

		let decl = declarationOf(`a { b: x; }`)

		decl.prop = `xurl`
		decl.raws.between = ` (x/y:z): `
		expect(colonIndexInBetween(css, decl, RESULT)).toBe(5)
	})

	it(`a parenthesised group, which is one token to PostCSS with the colon inside it, unless a comment or a quote inside breaks it into tokens`, () => {
		expect(colonOf(`a { b (x:y): x; }`)).toBe(6)
		expect(colonOf(`a { b ("x":y): x; }`)).toBe(5)

		let decl = declarationOf(`a { b: x; }`)

		decl.raws.between = ` (x/*c*/:y): `
		expect(colonIndexInBetween(css, decl, RESULT)).toBe(8)
	})

	it(`a between spelling no colon outside a comment or a string`, () => {
		let decl = declarationOf(`a { b: x; }`)

		decl.raws.between = ` /*:*/ `
		expect(colonIndexInBetween(css, decl, RESULT)).toBe(-1)

		decl.raws.between = ` "x:" `
		expect(colonIndexInBetween(css, decl, RESULT)).toBe(-1)

		delete decl.raws.between
		expect(colonIndexInBetween(css, decl, RESULT)).toBe(-1)
	})
})
