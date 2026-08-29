import { parse } from "postcss"
import scss, { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { nodeSyntax } from "./index.ts"

describe(`nodeSyntax`, () => {
	it(`takes the syntax the file was opened with`, () => {
		let root = parseScss(`a { color: pink }`, { from: undefined })

		expect(nodeSyntax((root.first as import("postcss").Rule), (({ opts: { syntax: scss } } as unknown) as import("stylelint").PostcssResult))).toBe(scss)
	})

	it(`prefers the syntax of the node's own root, which a host language sets per embedded stylesheet`, () => {
		let root = parse(`a { color: pink }`)
		let source = (root.source as import("../typeGuards/index.ts").EmbeddedSource)

		source.syntax = scss

		expect(nodeSyntax((root.first as import("postcss").Rule), (({ opts: { syntax: `other` } } as unknown) as import("stylelint").PostcssResult))).toBe(scss)
	})

	it(`has nothing to hand back for a file read as plain CSS`, () => {
		let root = parse(`a { color: pink }`)

		expect(nodeSyntax((root.first as import("postcss").Rule), (({ opts: {} } as unknown) as import("stylelint").PostcssResult))).toBe(undefined)
	})

	it(`has nothing to hand back where no result is given`, () => {
		let root = parse(`a { color: pink }`)

		expect(nodeSyntax((root.first as import("postcss").Rule))).toBe(undefined)
	})
})
