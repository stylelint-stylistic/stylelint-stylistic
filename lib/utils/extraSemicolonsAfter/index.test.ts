import { parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"

import { extraSemicolonsAfter, readsTheRawsOf } from "./index.ts"

/** A syntax calling every at-rule no standard one, as the Less one calls a mixin call. */
const REFUSING: Syntax = { ...css, isStandardAtRule: () => false }

/** A result carrying nothing the questions read. */
const RESULT = { stylelint: { config: { rules: {} } } } as unknown as PostcssResult

describe(`extraSemicolonsAfter`, () => {
	it(`every semicolon of the run in front of the closing brace`, () => {
		expect(extraSemicolonsAfter(css, parse(`a {\n\tb: c;\n;\n;\n}`).first as Rule, RESULT)).toEqual([1, 3])
		expect(extraSemicolonsAfter(css, parse(`a { b: c; ; }`).first as Rule, RESULT)).toEqual([1])
	})

	it(`nothing in a run of whitespace alone`, () => {
		expect(extraSemicolonsAfter(css, parse(`a {\n\tb: c;\n}`).first as Rule, RESULT)).toEqual([])
	})

	it(`nothing behind an at-rule closing the block that the syntax calls no standard one, as a Less mixin call putting its own semicolon there, and every one behind a charset all the same`, () => {
		expect(extraSemicolonsAfter(REFUSING, parse(`a {\n\t@m;;\n}`).first as Rule, RESULT)).toEqual([])
		expect(extraSemicolonsAfter(REFUSING, parse(`a {\n\t@charset "x";;\n}`).first as Rule, RESULT)).toEqual([0])
	})
})

describe(`readsTheRawsOf`, () => {
	it(`a standard rule and at-rule, and a declaration`, () => {
		let root = parse(`a { b: c; } @media x {}`)
		let declaration = (root.first as Rule).first

		expect(root.nodes.map((node) => readsTheRawsOf(css, node))).toEqual([true, true])
		expect(declaration && readsTheRawsOf(css, declaration)).toBe(true)
	})

	it(`an at-rule the syntax calls no standard one passed over, a charset excepted`, () => {
		let [atRule, charset] = parse(`@m; @charset "x";`).nodes

		expect(atRule && readsTheRawsOf(REFUSING, atRule)).toBe(false)
		expect(charset && readsTheRawsOf(REFUSING, charset)).toBe(true)
	})
})
