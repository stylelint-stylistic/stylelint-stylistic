import { parse } from "postcss"
import postcssScss, { parse as parseScss } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { neighborCopies, neighborSettings, speaksOf } from "./index.ts"

/** A plain CSS root, which every namespace reads. */
const NODE = parse(`a {}`)

const SPACE = `@stylistic/declaration-block-semicolon-space-before`
const NEWLINE = `@stylistic/declaration-block-semicolon-newline-before`

const RULES = {
	space: { name: `declaration-block-semicolon-space-before`, options: [`always`, `never`] },
	newline: { name: `declaration-block-semicolon-newline-before`, options: [`always`] },
}

describe(`neighborSettings`, () => {
	it(`nothing where the configuration lists none of the neighbors`, () => {
		expect(read({})).toEqual([])
		expect(read({ "@stylistic/color-hex-case": `lower` })).toEqual([])
	})

	it(`each neighbor under the caller's key with its primary option, in the order the configuration lists them`, () => {
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": `always`, "@stylistic/declaration-block-semicolon-newline-before": `always` })).toEqual([[`space`, `always`, false, SPACE], [`newline`, `always`, false, NEWLINE]])
		expect(read({ "@stylistic/declaration-block-semicolon-newline-before": `always`, "@stylistic/declaration-block-semicolon-space-before": `never` })).toEqual([[`newline`, `always`, false, NEWLINE], [`space`, `never`, false, SPACE]])
	})

	it(`the option out of the array a configuration lists a rule's options in`, () => {
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": [`never`] })).toEqual([[`space`, `never`, false, SPACE]])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": [`always`, {}] })).toEqual([[`space`, `always`, false, SPACE]])
	})

	it(`nothing for a rule listed with an option it refuses, or with no keyword at all`, () => {
		expect(read({ "@stylistic/declaration-block-semicolon-newline-before": `never` })).toEqual([])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": true })).toEqual([])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": null })).toEqual([])
	})

	it(`whether the fix is turned off, read out of the secondary options the truthy way the report gate reads it`, () => {
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": [`never`, { disableFix: true }] })).toEqual([[`space`, `never`, true, SPACE]])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": [`never`, { disableFix: `yes` }] })).toEqual([[`space`, `never`, true, SPACE]])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": [`never`, { disableFix: false }] })).toEqual([[`space`, `never`, false, SPACE]])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": [`never`, { disableFix: 0 }] })).toEqual([[`space`, `never`, false, SPACE]])
		expect(read({ "@stylistic/declaration-block-semicolon-space-before": [`never`, { severity: `warning` }] })).toEqual([[`space`, `never`, false, SPACE]])
	})

	it(`a table with a key left empty, as a table shared by callers with unlike neighbors leaves some`, () => {
		expect(neighborSettings<`space` | `newline`>(NODE, result({ "@stylistic/declaration-block-semicolon-space-before": `always` }), { space: RULES.space })).toEqual([[`space`, `always`, false, SPACE]])
	})

	it(`a neighbor under the one namespace reading the root: the core's over plain CSS where its copy is configured, else the first listed`, () => {
		expect(read({ "@stylistic/scss/declaration-block-semicolon-space-before": `always` })).toEqual([[`space`, `always`, false, `@stylistic/scss/declaration-block-semicolon-space-before`]])
		expect(read({ "@stylistic/less/declaration-block-semicolon-space-before": `never`, "@stylistic/declaration-block-semicolon-space-before": `always` })).toEqual([[`space`, `always`, false, `@stylistic/declaration-block-semicolon-space-before`]])
		expect(read({ "@stylistic/less/declaration-block-semicolon-space-before": `never`, "@stylistic/scss/declaration-block-semicolon-space-before": `always` })).toEqual([[`space`, `never`, false, `@stylistic/less/declaration-block-semicolon-space-before`]])
	})

	it(`no neighbor under a namespace refusing the root`, () => {
		let scssResult = { opts: { syntax: postcssScss }, stylelint: { config: { customSyntax: `postcss-scss`, rules: { "@stylistic/less/declaration-block-semicolon-space-before": `always`, "@stylistic/scss/declaration-block-semicolon-space-before": `never` } } } } as unknown as PostcssResult

		expect(neighborSettings(parseScss(`a {}`), scssResult, RULES)).toEqual([[`space`, `never`, false, `@stylistic/scss/declaration-block-semicolon-space-before`]])
	})

	it(`nothing where the result carries no configuration`, () => {
		expect(neighborSettings(NODE, {} as PostcssResult, RULES)).toEqual([])
	})

	it(`the lineness-conditioned neighbors behind the rest, and among themselves in the plugin's own order rather than the configuration's`, () => {
		let neighbors = {
			plain: { name: `declaration-block-semicolon-space-before`, options: [`always`] },
			space: { name: `declaration-colon-space-after`, options: [`always-single-line`] },
			newline: { name: `declaration-block-semicolon-newline-before`, options: [`always-multi-line`] },
			semicolonAfter: { name: `declaration-block-semicolon-space-after`, options: [`never-single-line`] },
		}
		let expected = [[`plain`, `always`, false, SPACE], [`space`, `always-single-line`, false, `@stylistic/declaration-colon-space-after`], [`newline`, `always-multi-line`, false, NEWLINE], [`semicolonAfter`, `never-single-line`, false, `@stylistic/declaration-block-semicolon-space-after`]]

		expect(neighborSettings(NODE, result({
			"@stylistic/declaration-block-semicolon-space-after": `never-single-line`,
			"@stylistic/declaration-block-semicolon-newline-before": `always-multi-line`,
			"@stylistic/declaration-colon-space-after": `always-single-line`,
			"@stylistic/declaration-block-semicolon-space-before": `always`,
		}), neighbors)).toEqual(expected)
		expect(neighborSettings(NODE, result({
			"@stylistic/declaration-colon-space-after": `always-single-line`,
			"@stylistic/declaration-block-semicolon-space-before": `always`,
			"@stylistic/declaration-block-semicolon-space-after": `never-single-line`,
			"@stylistic/declaration-block-semicolon-newline-before": `always-multi-line`,
		}), neighbors)).toEqual(expected)
	})
})

describe(`neighborCopies`, () => {
	let grid = { name: `named-grid-areas-alignment`, options: [true] as (string | true)[] }
	let trailing = { name: `declaration-block-trailing-semicolon`, options: [`always`, `never`] }

	it(`nothing where the neighbor is unlisted, or listed with a primary it refuses`, () => {
		expect(neighborCopies(NODE, result({}), grid)).toEqual([])
		expect(neighborCopies(NODE, result({ "@stylistic/named-grid-areas-alignment": false }), grid)).toEqual([])
		expect(neighborCopies(NODE, result({ "@stylistic/declaration-block-trailing-semicolon": `sometimes` }), trailing)).toEqual([])
	})

	it(`a copy read whole, true as its primary, its secondaries and whether its fix is off`, () => {
		expect(neighborCopies(NODE, result({ "@stylistic/named-grid-areas-alignment": [true, { alignColumns: true, disableFix: true }] }), grid)).toMatchObject([{ option: true, fixDisabled: true, secondary: { alignColumns: true, disableFix: true }, name: `@stylistic/named-grid-areas-alignment`, syntax: css }])
		expect(neighborCopies(NODE, result({ "@stylistic/declaration-block-trailing-semicolon": `never` }), trailing)).toMatchObject([{ option: `never`, fixDisabled: false, secondary: {} }])
	})

	it(`the one copy reading the root, with its namespace's syntax: the core's over plain CSS, listed second`, () => {
		let copies = neighborCopies(NODE, result({ "@stylistic/scss/declaration-block-trailing-semicolon": `never`, "@stylistic/declaration-block-trailing-semicolon": `always` }), trailing)

		expect(copies.map(({ option, name, syntax }) => [option, name, syntax.namespace])).toEqual([[`always`, `@stylistic/declaration-block-trailing-semicolon`, undefined]])
	})

	it(`no copy under a namespace refusing the root`, () => {
		let scssResult = { opts: { syntax: postcssScss }, stylelint: { config: { customSyntax: `postcss-scss`, rules: { "@stylistic/less/declaration-block-trailing-semicolon": `always`, "@stylistic/scss/declaration-block-trailing-semicolon": `never` } } } } as unknown as PostcssResult

		expect(neighborCopies(parseScss(`a {}`), scssResult, trailing).map(({ name }) => name)).toEqual([`@stylistic/scss/declaration-block-trailing-semicolon`])
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
 * Reads the two neighbors' settings out of a configuration.
 * @param rules - The rules the configuration lists, in the order it lists them.
 * @returns What `neighborSettings` answers.
 */
function read (rules: Record<string, unknown>): [string, string, boolean, string][] {
	return neighborSettings(NODE, result(rules), RULES)
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @returns The result.
 */
function result (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}
