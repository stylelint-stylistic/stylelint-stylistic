import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"

import { neighbourSettings, speaksOf } from "./index.ts"

const RULES = {
	space: { name: `declaration-block-semicolon-space-before`, options: [`always`, `never`] },
	newline: { name: `declaration-block-semicolon-newline-before`, options: [`always`] },
}

describe(`neighbourSettings`, () => {
	it(`nothing where the configuration lists none of the neighbours`, () => {
		expect(read({})).toEqual([])
		expect(read({ "@stylistic/color-hex-case": `lower` })).toEqual([])
	})

	it(`each neighbour under the caller's key with its primary option, in the order the configuration lists them`, () => {
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": `always`, "@stylistic/declaration-block-semicolon-newline-before": `always` })).toEqual([[`space`, `always`], [`newline`, `always`]])
		expect(read({ "@stylistic/declaration-block-semicolon-newline-before": `always`, "@stylistic/declaration-block-semicolon-space-before": `never` })).toEqual([[`newline`, `always`], [`space`, `never`]])
	})

	it(`the option out of the array a configuration lists a rule's options in`, () => {
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": [`never`] })).toEqual([[`space`, `never`]])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": [`always`, {}] })).toEqual([[`space`, `always`]])
	})

	it(`nothing for a rule listed with an option it refuses, or with no keyword at all`, () => {
		expect(read({ "@stylistic/declaration-block-semicolon-newline-before": `never` })).toEqual([])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": true })).toEqual([])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": null })).toEqual([])
	})

	it(`a table with a key left empty, as a table shared by callers with unlike neighbours leaves some`, () => {
		expect(neighbourSettings<`space` | `newline`>(css, result({ "@stylistic/declaration-block-semicolon-space-before": `always` }), { space: RULES.space })).toEqual([[`space`, `always`]])
	})

	it(`the names of the asking rule's own namespace, and not the core's`, () => {
		let scss: Syntax = { ...css, namespace: `scss` }

		expect(read({ "@stylistic/declaration-block-semicolon-space-before": `always` }, scss)).toEqual([])
		expect(read({ "@stylistic/scss/declaration-block-semicolon-space-before": `always` }, scss)).toEqual([[`space`, `always`]])
		expect(read({ "@stylistic/scss/declaration-block-semicolon-space-before": `always` })).toEqual([])
	})

	it(`nothing where the result carries no configuration`, () => {
		expect(neighbourSettings(css, {} as PostcssResult, RULES)).toEqual([])
	})
})

describe(`speaksOf`, () => {
	it(`always and never, of every text`, () => {
		expect(speaksOf(`always`, () => true)).toBe(true)
		expect(speaksOf(`always`, () => false)).toBe(true)
		expect(speaksOf(`never`, () => true)).toBe(true)
		expect(speaksOf(`never`, () => false)).toBe(true)
	})

	it(`the single-line options, of a text on one line`, () => {
		expect(speaksOf(`always-single-line`, () => true)).toBe(true)
		expect(speaksOf(`always-single-line`, () => false)).toBe(false)
		expect(speaksOf(`never-single-line`, () => true)).toBe(true)
		expect(speaksOf(`never-single-line`, () => false)).toBe(false)
	})

	it(`the multi-line options, of a text over several`, () => {
		expect(speaksOf(`always-multi-line`, () => true)).toBe(false)
		expect(speaksOf(`always-multi-line`, () => false)).toBe(true)
		expect(speaksOf(`never-multi-line`, () => true)).toBe(false)
		expect(speaksOf(`never-multi-line`, () => false)).toBe(true)
	})

	it(`an option outside the six, of nothing`, () => {
		expect(speaksOf(`sometimes`, () => true)).toBe(false)
	})
})

/**
 * Reads the two neighbours' settings out of a configuration.
 * @param rules - The rules the configuration lists, in the order it lists them.
 * @param syntax - The syntax the asking rule is built over.
 * @returns What `neighbourSettings` answers.
 */
function read (rules: Record<string, unknown>, syntax: Syntax = css): [string, string][] {
	return neighbourSettings(syntax, result(rules), RULES)
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @returns The result.
 */
function result (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}
