import { type Declaration, parse } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { declarationValueAsSpelled } from "./index.ts"

const TRAILING = `@stylistic/declaration-block-trailing-semicolon`

/**
 * Parses one declaration out of a stylesheet and reads its value as the file spells it.
 * @param code - The stylesheet to parse.
 * @param rules - The rules the configuration lists; none names no syntax, so the file is read as plain CSS.
 * @returns The value of its first declaration.
 */
function valueOf (code: string, rules: Record<string, unknown> = {}): string {
	let decl: Declaration | undefined

	parse(code).walkDecls((found) => {
		decl ??= found
	})

	if (!decl) throw new Error(`The stylesheet holds no declaration`)

	return declarationValueAsSpelled(css, decl, { stylelint: { config: { rules } } } as unknown as PostcssResult)
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

	it(`a custom property closed by a semicolon, whose value is the printed text whole, the run in front of the semicolon and all`, () => {
		expect(valueOf(`a { --b:\n; }`)).toBe(`\n`)
		expect(valueOf(`a { --b: x\n; }`)).toBe(`x\n`)
		expect(valueOf(`a { --b:\n  x; }`)).toBe(`x`)
		expect(valueOf(`a { --b: /*c\n*/; }`)).toBe(` /*c\n*/`)
	})

	it(`a custom property closed by the brace or the file's end alone, whose run in front of it the parser keeps in the value and which is the block's`, () => {
		expect(valueOf(`a { --b: x\n}`)).toBe(`x`)
		expect(valueOf(`a { --b:\n}`)).toBe(``)
		expect(valueOf(`a { --b: x /*c\n*/\n}`)).toBe(`x /*c\n*/`)
		expect(valueOf(`--b: x\n`)).toBe(`x`)
	})

	it(`the same custom property as the trailing-semicolon rule will leave it: closed where its always writes the semicolon behind the run, open where its never takes the semicolon and the run`, () => {
		expect(valueOf(`a { --b: x\n}`, { [TRAILING]: `always` })).toBe(`x\n`)
		expect(valueOf(`a { --b: x\n; }`, { [TRAILING]: `never` })).toBe(`x`)
	})

	it(`the same custom property behind a flag spelled with a space, which leaves the value's trailing run in front of the flag, inside the declaration`, () => {
		expect(valueOf(`a { --b: x\n! important\n}`)).toBe(`x\n`)
	})
})
