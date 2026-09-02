import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { Declaration, Document } from "postcss"
import scssSyntax, { parse as scssParse } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { colonTokenIndex } from "./index.ts"

describe(`colonTokenIndex`, () => {
	it(`the package looked for from the stylesheet before the module, since Stylelint reads a syntax from the configuration that named it and a module reads one from itself`, () => {
		let tree = mkdtempSync(path.join(tmpdir(), `colon-`))
		let placed = path.join(tree, `node_modules`, `postcss-scss`, `lib`)

		mkdirSync(placed, { recursive: true })
		writeFileSync(path.join(placed, `scss-tokenize.js`), `module.exports = () => ({ endOfFile: () => false, nextToken: () => [":", ":", 998] })\n`)

		try {
			expect(colonTokenIndex(``, `: `, scssSyntax, path.join(tree, `a.scss`))).toBe(998)
			expect(colonTokenIndex(``, `: `, scssSyntax, path.join(tmpdir(), `elsewhere.scss`))).toBe(0)
		}
		finally {
			rmSync(tree, { recursive: true, force: true })
		}
	})

	it(`the first colon a tokenizer reads as one, a colon of a comment, a string or a group being text`, () => {
		expect(colonTokenIndex(`b`, `: `)).toBe(0)
		expect(colonTokenIndex(`b`, `/*x:y*/: `)).toBe(7)
		expect(colonTokenIndex(`b`, ` "x:" : `)).toBe(6)
		expect(colonTokenIndex(`b`, ` (x:y): `)).toBe(6)
	})

	it(`a colon standing in front of the text, which the parser cannot have read as one, since it ended the property elsewhere`, () => {
		expect(colonTokenIndex(`b:c`, `: `)).toBe(0)
	})

	it(`a property of the parser's own making that opens a comment over the whole of the text, which is then read on its own terms`, () => {
		expect(colonTokenIndex(`/*]`, `: `)).toBe(0)
	})

	it(`the tokenizer of the syntax that reads an inline comment itself, against the one that reads a double slash as code`, () => {
		expect(colonTokenIndex(`b`, ` //x:y\n: `, scssSyntax)).toBe(7)
		expect(colonTokenIndex(`b`, ` //x:y\n: `)).toBe(4)
	})

	it(`a syntax that says nothing of an inline comment, which is answered as plain CSS: a tokenizer read for a parser that never used it reads constructs that parser never saw`, () => {
		// The two ways a syntax says nothing: one that cannot read the probe as a stylesheet at all, and one that reads it and finds no rule or declaration in it, which is what `postcss-styled-syntax` does with a file holding no template
		let refusesTheProbe = { parse: (): Declaration => new Declaration({ prop: `a`, value: `b` }) }
		let findsNothingInIt = { parse: (): Document => new Document() }

		expect(colonTokenIndex(`b`, ` //x:y\n: `, refusesTheProbe)).toBe(4)
		expect(colonTokenIndex(`b`, ` //x:y\n: `, findsNothingInIt)).toBe(4)
	})

	it(`a string and an interpolation left open, which the SCSS tokenizer throws over whatever it is told and PostCSS's reads to the end of the text`, () => {
		expect(colonTokenIndex(`b`, ` "x: `, scssSyntax)).toBe(3)
		expect(colonTokenIndex(`b`, ` #{x: `, scssSyntax)).toBe(4)
	})

	it(`the colon of a declaration the parser of an SCSS file built, which is where that parser stopped reading the property`, () => {
		let decl: Declaration | undefined

		scssParse(`a { b //x:y\n: red; }`).walkDecls((found) => {
			decl ??= found
		})

		if (!decl) throw new Error(`The stylesheet holds no declaration`)

		expect(colonTokenIndex(decl.prop, decl.raws.between ?? ``, scssSyntax)).toBe(7)
	})
})
