import { type Declaration, parse } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { declarationValueAsSpelled } from "./index.ts"

/** The least of a Stylelint result, which names no syntax, so that the file is read as plain CSS. */
const RESULT = {} as unknown as PostcssResult

/**
 * Parses one declaration out of a block and reads its value as the file spells it.
 * @param block - The block to parse.
 * @returns The value of its first declaration.
 */
function valueOf (block: string): string {
	let decl: Declaration | undefined

	parse(block).walkDecls((found) => {
		decl ??= found
	})

	if (!decl) throw new Error(`The block holds no declaration`)

	return declarationValueAsSpelled(css, decl, RESULT)
}

describe(`declarationValueAsSpelled`, () => {
	it(`the comments the parser moved into the raw between in front of the first word, read back without the run behind the colon`, () => {
		expect(valueOf(`a { b:  /*c*/\nx; }`)).toBe(`/*c*/\nx`)
		expect(valueOf(`a { b: /*c\n*/ x; }`)).toBe(`/*c\n*/ x`)
		expect(valueOf(`a { b:\n  x; }`)).toBe(`x`)
	})

	it(`the comments the parser dropped out of the value, read back out of the raw beside it`, () => {
		expect(valueOf(`a { b: x /*c\n*/ y; }`)).toBe(`x /*c\n*/ y`)
		expect(valueOf(`a { b: x /*c\n*/ ; }`)).toBe(`x /*c\n*/`)
		expect(valueOf(`a { b: x /*c\n*/ !important; }`)).toBe(`x /*c\n*/`)
	})

	it(`the trailing run of an ordinary value, which the parser keeps out of the value and which is the semicolon's`, () => {
		expect(valueOf(`a { b: x\n; }`)).toBe(`x`)
		expect(valueOf(`a { b:\n; }`)).toBe(``)
		expect(valueOf(`a { b:\n}`)).toBe(``)
	})

	it(`a value with no word of its own, whose head the parser leaves in the value`, () => {
		expect(valueOf(`a { b:\n/*c*/; }`)).toBe(`\n/*c*/`)
	})

	it(`a custom property, whose value is the printed text whole, trailing run and all`, () => {
		expect(valueOf(`a { --b:\n; }`)).toBe(`\n`)
		expect(valueOf(`a { --b: x\n; }`)).toBe(`x\n`)
		expect(valueOf(`a { --b:\n  x; }`)).toBe(`x`)
		expect(valueOf(`a { --b: /*c\n*/; }`)).toBe(` /*c\n*/`)
	})
})
