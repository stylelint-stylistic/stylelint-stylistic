import { parse } from "postcss"
import postcssScss, { parse as parseScss } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { neighbourSettings, speaksOf } from "./index.ts"

/** A plain CSS root, which every namespace reads. */
const NODE = parse(`a {}`)

const SPACE = `@stylistic/declaration-block-semicolon-space-before`
const NEWLINE = `@stylistic/declaration-block-semicolon-newline-before`

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

	it(`a table with a key left empty, as a table shared by callers with unlike neighbours leaves some`, () => {
		expect(neighbourSettings<`space` | `newline`>(NODE, result({ "@stylistic/declaration-block-semicolon-space-before": `always` }), { space: RULES.space })).toEqual([[`space`, `always`, false, SPACE]])
	})

	// See #710
	it(`a neighbour under every namespace reading the root, a rule listed under two of them twice`, () => {
		expect(read({ "@stylistic/scss/declaration-block-semicolon-space-before": `always` })).toEqual([[`space`, `always`, false, `@stylistic/scss/declaration-block-semicolon-space-before`]])
		expect(read({ "@stylistic/less/declaration-block-semicolon-space-before": `never`, "@stylistic/declaration-block-semicolon-space-before": `always` })).toEqual([[`space`, `never`, false, `@stylistic/less/declaration-block-semicolon-space-before`], [`space`, `always`, false, SPACE]])
	})

	it(`no neighbour under a namespace refusing the root`, () => {
		let scssResult = { opts: { syntax: postcssScss }, stylelint: { config: { customSyntax: `postcss-scss`, rules: { "@stylistic/less/declaration-block-semicolon-space-before": `always`, "@stylistic/scss/declaration-block-semicolon-space-before": `never` } } } } as unknown as PostcssResult

		expect(neighbourSettings(parseScss(`a {}`), scssResult, RULES)).toEqual([[`space`, `never`, false, `@stylistic/scss/declaration-block-semicolon-space-before`]])
	})

	it(`two lineness-conditioned copies of one rule in the order their checks flush, the core's first`, () => {
		let neighbours = { space: { name: `declaration-colon-space-after`, options: [`always-single-line`] } }
		let expected = [[`space`, `always-single-line`, false, `@stylistic/declaration-colon-space-after`], [`space`, `always-single-line`, false, `@stylistic/scss/declaration-colon-space-after`]]

		expect(neighbourSettings(NODE, result({ "@stylistic/scss/declaration-colon-space-after": `always-single-line`, "@stylistic/declaration-colon-space-after": `always-single-line` }), neighbours)).toEqual(expected)
	})

	it(`nothing where the result carries no configuration`, () => {
		expect(neighbourSettings(NODE, {} as PostcssResult, RULES)).toEqual([])
	})

	it(`the lineness-conditioned neighbours behind the rest, and among themselves in the plugin's own order rather than the configuration's`, () => {
		let neighbours = {
			plain: { name: `declaration-block-semicolon-space-before`, options: [`always`] },
			space: { name: `declaration-colon-space-after`, options: [`always-single-line`] },
			newline: { name: `declaration-block-semicolon-newline-before`, options: [`always-multi-line`] },
			semicolonAfter: { name: `declaration-block-semicolon-space-after`, options: [`never-single-line`] },
		}
		let expected = [[`plain`, `always`, false, SPACE], [`space`, `always-single-line`, false, `@stylistic/declaration-colon-space-after`], [`newline`, `always-multi-line`, false, NEWLINE], [`semicolonAfter`, `never-single-line`, false, `@stylistic/declaration-block-semicolon-space-after`]]

		expect(neighbourSettings(NODE, result({
			"@stylistic/declaration-block-semicolon-space-after": `never-single-line`,
			"@stylistic/declaration-block-semicolon-newline-before": `always-multi-line`,
			"@stylistic/declaration-colon-space-after": `always-single-line`,
			"@stylistic/declaration-block-semicolon-space-before": `always`,
		}), neighbours)).toEqual(expected)
		expect(neighbourSettings(NODE, result({
			"@stylistic/declaration-colon-space-after": `always-single-line`,
			"@stylistic/declaration-block-semicolon-space-before": `always`,
			"@stylistic/declaration-block-semicolon-space-after": `never-single-line`,
			"@stylistic/declaration-block-semicolon-newline-before": `always-multi-line`,
		}), neighbours)).toEqual(expected)
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
 * @returns What `neighbourSettings` answers.
 */
function read (rules: Record<string, unknown>): [string, string, boolean, string][] {
	return neighbourSettings(NODE, result(rules), RULES)
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @returns The result.
 */
function result (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}
