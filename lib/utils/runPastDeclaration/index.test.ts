import { type Declaration, parse, type Rule } from "postcss"
import { parse as parseScss } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { runPastDeclaration, runPastDeclarationEndsTheStylesheet, writeRunPastDeclaration } from "./index.ts"

/** The least of a Stylelint result, which names no syntax, so that the stylesheet is read as plain CSS. */
const RESULT = {} as unknown as PostcssResult

/**
 * Parses one declaration out of a stylesheet.
 * @param code - The stylesheet.
 * @param [index] - Which declaration of it to take, the first by default.
 * @returns That declaration.
 */
function declarationOf (code: string, index: number = 0): Declaration {
	let found: Declaration[] = []

	parse(code).walkDecls((decl) => {
		found.push(decl)
	})

	let decl = found[index]

	if (!decl) throw new Error(`The stylesheet holds no such declaration`)

	return decl
}

/**
 * Reads the run standing past one declaration of a stylesheet.
 * @param code - The stylesheet.
 * @param [index] - Which declaration of it to ask about, the first by default.
 * @returns The run, or nothing where the whitespace behind the colon is the declaration's own.
 */
function run (code: string, index?: number): string | undefined {
	return runPastDeclaration(css, declarationOf(code, index), RESULT)
}

/**
 * Asks whether the run standing past one declaration of a stylesheet is that stylesheet's own tail.
 * @param code - The stylesheet.
 * @param [index] - Which declaration of it to ask about, the first by default.
 * @returns True where there is such a run and the raw holding it ends the stylesheet.
 */
function endsTheStylesheet (code: string, index?: number): boolean {
	return runPastDeclarationEndsTheStylesheet(css, declarationOf(code, index), RESULT)
}

describe(`runPastDeclaration`, () => {
	it(`the two raws the run reaches: the block's own, and that of a comment written behind the declaration`, () => {
		expect(run(`a { b:  }`)).toBe(`  `)
		expect(run(`a { b:  /*c*/ }`)).toBe(`  `)
		expect(run(`a { b:}`)).toBe(``)
		expect(run(`a { c: red; b:\n\t}`, 1)).toBe(`\n\t`)
	})

	it(`a semicolon behind the declaration, which keeps the run inside the value`, () => {
		expect(run(`a { b:  ; }`)).toBeUndefined()
		expect(run(`a { b:  ; c: red }`)).toBeUndefined()
	})

	it(`a declaration printing something behind its colon, which holds the run itself`, () => {
		expect(run(`a { --b:  }`)).toBeUndefined()
		expect(run(`a { b:  !important }`)).toBeUndefined()
		expect(run(`a { b: red }`)).toBeUndefined()
	})

	it(`a declaration standing at the top level of a stylesheet, whose root's raw is the tail of the file`, () => {
		expect(run(`b:  `)).toBeUndefined()
		expect(run(`b:`)).toBeUndefined()
	})

	it(`the same declaration with a comment written behind it, which bounds the run as any other node does`, () => {
		expect(run(`b:  /*c*/`)).toBe(`  `)
		expect(run(`b:  /*c*/\n`)).toBe(`  `)
	})

	it(`a nested property of Sass, whose block the parser hangs on a declaration`, () => {
		let root = parseScss(`a { font: 2px/3px { family:  } }`)
		let inner = ((root.first as Rule).first as Declaration & { first: Declaration }).first

		expect(runPastDeclaration(css, inner, RESULT)).toBe(`  `)
	})

	it(`a declaration that is not the one its block ends on`, () => {
		let rule = parse(`a { b:  ; c: red }`).first as Rule

		rule.raws.semicolon = false
		expect(runPastDeclaration(css, rule.first as Declaration, RESULT)).toBeUndefined()
	})

	it(`a raw the node carries none of, which PostCSS computes for itself, and one holding more than whitespace`, () => {
		let decl = declarationOf(`a { b:  }`)
		let block = decl.parent as Rule

		delete block.raws.after
		expect(runPastDeclaration(css, decl, RESULT)).toBeUndefined()

		block.raws.after = ` /*c*/ `
		expect(runPastDeclaration(css, decl, RESULT)).toBeUndefined()
	})
})

describe(`runPastDeclarationEndsTheStylesheet`, () => {
	it(`a declaration standing last at the top level of a stylesheet, whose run is the tail of the file`, () => {
		expect(endsTheStylesheet(`b:  `)).toBe(true)
		expect(endsTheStylesheet(`b:`)).toBe(true)
		expect(endsTheStylesheet(`a { c: red }\nb:  `, 1)).toBe(true)
	})

	it(`a declaration with a node written behind it, whose run that node bounds`, () => {
		expect(endsTheStylesheet(`b:  /*c*/`)).toBe(false)
		expect(endsTheStylesheet(`a { b:  }`)).toBe(false)
	})

	it(`a declaration with no run past it at all, whatever holds the whitespace behind its colon`, () => {
		expect(endsTheStylesheet(`b: red`)).toBe(false)
		expect(endsTheStylesheet(`b:  ;`)).toBe(false)
		expect(endsTheStylesheet(`b:  !important`)).toBe(false)
		expect(endsTheStylesheet(`--b:  `)).toBe(false)
	})
})

describe(`writeRunPastDeclaration`, () => {
	it(`writes into the block's own raw, where the declaration closes the block`, () => {
		let decl = declarationOf(`a { b:  }`)

		writeRunPastDeclaration(decl, `\n`)
		expect(decl.root().toString()).toBe(`a { b:\n}`)
	})

	it(`writes into the raw of the comment standing behind the declaration, leaving the block's own alone`, () => {
		let decl = declarationOf(`a { b:  /*c*/ }`)

		writeRunPastDeclaration(decl, ` `)
		expect(decl.root().toString()).toBe(`a { b: /*c*/ }`)
	})
})
