import { type Declaration, parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { NeighbourRule } from "../neighbourSettings/index.ts"

import { type Whitespace, whitespaceAsked } from "./index.ts"

const NEWLINE_AFTER = `@stylistic/function-comma-newline-after`
const SPACE_AFTER = `@stylistic/function-comma-space-after`

/** The two rules about the run behind a call's comma, which is the run the tests below ask about. */
const RULES: Partial<Record<Whitespace, NeighbourRule>> = {
	newline: {
		name: `function-comma-newline-after`,
		options: [`always`, `always-multi-line`, `never-multi-line`],
	},
	space: {
		name: `function-comma-space-after`,
		options: [`always`, `never`, `always-single-line`, `never-single-line`],
	},
}

describe(`whitespaceAsked`, () => {
	it(`nothing where no rule speaks of the run, or the fallback the caller names`, () => {
		expect(ask({})).toBe(``)
		expect(ask({}, ` `)).toBe(` `)
		expect(ask({ [NEWLINE_AFTER]: `always-multi-line` }, ` `)).toBe(` `)
		expect(ask({ [SPACE_AFTER]: `sometimes` }, ` `)).toBe(` `)
	})

	it(`nothing under a never option, whatever the fallback, since the rule speaks and asks for none`, () => {
		expect(ask({ [SPACE_AFTER]: `never` }, ` `)).toBe(``)
		expect(ask({ [SPACE_AFTER]: `never-single-line` }, ` `)).toBe(``)
	})

	it(`a line break under the newline rule's always, and a space under the space rule's`, () => {
		expect(ask({ [NEWLINE_AFTER]: `always` })).toBe(`\n`)
		expect(ask({ [SPACE_AFTER]: `always` })).toBe(` `)
		expect(ask({ [SPACE_AFTER]: [`always-single-line`, {}] })).toBe(` `)
	})

	it(`the rule the configuration lists later, where both speak, since that is the one that runs last`, () => {
		expect(ask({ [SPACE_AFTER]: `always`, [NEWLINE_AFTER]: `always` })).toBe(`\n`)
		expect(ask({ [NEWLINE_AFTER]: `always`, [SPACE_AFTER]: `always` })).toBe(` `)
		expect(ask({ [NEWLINE_AFTER]: `always`, [SPACE_AFTER]: `never` })).toBe(``)
	})

	it(`a rule whose fix is turned off only where no live rule speaks`, () => {
		expect(ask({ [SPACE_AFTER]: [`never`, { disableFix: true }] }, ` `)).toBe(``)
		expect(ask({ [NEWLINE_AFTER]: [`always`, { disableFix: true }] })).toBe(`\n`)
		expect(ask({ [SPACE_AFTER]: `always`, [NEWLINE_AFTER]: [`always`, { disableFix: true }] })).toBe(` `)
		expect(ask({ [NEWLINE_AFTER]: [`always`, { disableFix: true }], [SPACE_AFTER]: `never` })).toBe(``)
	})

	it(`the break the file spells its lines with`, () => {
		expect(ask({ [NEWLINE_AFTER]: `always` }, ``, `a {\r\n\tb: c\r\n}`)).toBe(`\r\n`)
	})
})

/**
 * Reads the whitespace a fix would write behind the comma of a call in the last declaration of a stylesheet's first rule, the call standing on one line.
 * @param rules - The rules the configuration lists, in the order it lists them.
 * @param fallback - What to write where no rule speaks.
 * @param code - The stylesheet.
 * @returns The whitespace.
 */
function ask (rules: Record<string, unknown>, fallback: string = ``, code: string = `a { b: c }`): string {
	let decl = (parse(code).first as Rule).last as Declaration
	let result = { stylelint: { config: { rules } } } as unknown as PostcssResult

	return whitespaceAsked(css, decl, result, RULES, () => true, fallback)
}
