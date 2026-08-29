import { parse, type Rule } from "postcss"
import scss, { parse as parseScss } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import type { EmbeddedSource } from "../typeGuards/index.ts"

import { nodeSyntax } from "./index.ts"

describe(`nodeSyntax`, () => {
	it(`takes the syntax the file was opened with`, () => {
		let root = parseScss(`a { color: pink }`, { from: undefined })

		expect(nodeSyntax(root.first as Rule, { opts: { syntax: scss } } as unknown as PostcssResult)).toBe(scss)
	})

	it(`prefers the syntax of the node's own root, which a host language sets per embedded stylesheet`, () => {
		let root = parse(`a { color: pink }`)
		let source = root.source as EmbeddedSource

		source.syntax = scss

		expect(nodeSyntax(root.first as Rule, { opts: { syntax: `other` } } as unknown as PostcssResult)).toBe(scss)
	})

	it(`has nothing to hand back for a file read as plain CSS`, () => {
		let root = parse(`a { color: pink }`)

		expect(nodeSyntax(root.first as Rule, { opts: {} } as unknown as PostcssResult)).toBe(undefined)
	})

	it(`has nothing to hand back where no result is given`, () => {
		let root = parse(`a { color: pink }`)

		expect(nodeSyntax(root.first as Rule)).toBe(undefined)
	})
})
