import { type AtRule, parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { writesRunBehindBrace } from "./index.ts"

const SPACE = `@stylistic/block-closing-brace-space-after`
const NEWLINE = `@stylistic/block-closing-brace-newline-after`

const SINGLE_LINE = `a { color: pink; }b { color: red; }`
const MULTI_LINE = `a {\n\tcolor: pink;\n}b { color: red; }`

describe(`writesRunBehindBrace`, () => {
	it(`a configuration listing the asking rule alone, or neither of the two`, () => {
		expect(ask(SINGLE_LINE, { [SPACE]: `always` }, SPACE)).toBe(true)
		expect(ask(SINGLE_LINE, { [NEWLINE]: `always` }, NEWLINE)).toBe(true)
		expect(ask(SINGLE_LINE, { "@stylistic/color-hex-case": `lower` }, SPACE)).toBe(true)
		expect(ask(SINGLE_LINE, {}, NEWLINE)).toBe(true)
	})

	it(`a rule that is neither of the two`, () => {
		expect(ask(SINGLE_LINE, { [SPACE]: `always`, [NEWLINE]: `always` }, `@stylistic/color-hex-case`)).toBe(true)
	})

	it(`two options that accept one spelling in common, where both write and write the same`, () => {
		let rules = { [SPACE]: `never`, [NEWLINE]: `never-single-line` }

		expect(ask(SINGLE_LINE, rules, SPACE)).toBe(true)
		expect(ask(SINGLE_LINE, rules, NEWLINE)).toBe(true)
	})

	it(`two options that accept none, where the rule the configuration lists later is the one to write`, () => {
		expect(ask(SINGLE_LINE, { [SPACE]: `always`, [NEWLINE]: `always` }, SPACE)).toBe(false)
		expect(ask(SINGLE_LINE, { [SPACE]: `always`, [NEWLINE]: `always` }, NEWLINE)).toBe(true)
		expect(ask(SINGLE_LINE, { [NEWLINE]: `always`, [SPACE]: `always` }, SPACE)).toBe(true)
		expect(ask(SINGLE_LINE, { [NEWLINE]: `always`, [SPACE]: `always` }, NEWLINE)).toBe(false)
	})

	it(`a never option against an always one, which accept nothing in common either`, () => {
		expect(ask(SINGLE_LINE, { [SPACE]: `never`, [NEWLINE]: `always` }, SPACE)).toBe(false)
		expect(ask(SINGLE_LINE, { [NEWLINE]: `always`, [SPACE]: `never` }, SPACE)).toBe(true)
	})

	it(`a neighbour whose option says nothing of this block's lineness, which gates nothing`, () => {
		expect(ask(SINGLE_LINE, { [SPACE]: `always`, [NEWLINE]: `always-multi-line` }, SPACE)).toBe(true)
		expect(ask(MULTI_LINE, { [SPACE]: `always`, [NEWLINE]: `always-multi-line` }, SPACE)).toBe(false)
		expect(ask(MULTI_LINE, { [SPACE]: `always`, [NEWLINE]: `always-single-line` }, SPACE)).toBe(true)
	})

	it(`a neighbour whose fix the configuration turned off, which rewrites nothing and so gates nothing`, () => {
		expect(ask(SINGLE_LINE, { [SPACE]: `always`, [NEWLINE]: [`always`, { disableFix: true }] }, SPACE)).toBe(true)
	})

	it(`a neighbour deferred to the run's end, which writes behind an undeferred rule whatever the configuration's order`, () => {
		expect(ask(SINGLE_LINE, { [SPACE]: `always`, [NEWLINE]: `always-single-line` }, SPACE)).toBe(false)
		expect(ask(SINGLE_LINE, { [NEWLINE]: `always-single-line`, [SPACE]: `always` }, SPACE)).toBe(false)
		expect(ask(SINGLE_LINE, { [NEWLINE]: `always-single-line`, [SPACE]: `always` }, NEWLINE)).toBe(true)
	})

	it(`two deferred options, which the plugin orders rather than the configuration: the break rule ahead of the space rule`, () => {
		expect(ask(SINGLE_LINE, { [SPACE]: `always-single-line`, [NEWLINE]: `always-single-line` }, NEWLINE)).toBe(false)
		expect(ask(SINGLE_LINE, { [NEWLINE]: `always-single-line`, [SPACE]: `always-single-line` }, NEWLINE)).toBe(false)
		expect(ask(SINGLE_LINE, { [SPACE]: `always-single-line`, [NEWLINE]: `always-single-line` }, SPACE)).toBe(true)
	})

	it(`a neighbour listed under an option it does not accept, which is no neighbour at all`, () => {
		expect(ask(SINGLE_LINE, { [SPACE]: `always`, [NEWLINE]: `never` }, SPACE)).toBe(true)
	})

	it(`a comment ending the brace's line, which the break rule reads past, so the two write different raws and contend over nothing`, () => {
		let rules = { [SPACE]: `never`, [NEWLINE]: `always` }

		expect(ask(`a {} /* c */ b {}`, rules, SPACE)).toBe(true)
		expect(ask(`a {} /* c */ b {}`, rules, NEWLINE)).toBe(true)
		expect(ask(`a {} /* c */\nb {}`, rules, SPACE)).toBe(true)
	})

	it(`a comment on a line of its own, which the break rule reads no further than, so the two do write one raw`, () => {
		expect(ask(`a {}\n/* c */ b {}`, { [SPACE]: `never`, [NEWLINE]: `always` }, SPACE)).toBe(false)
	})

	it(`a comment ending the file behind the brace, behind which the break rule writes no raw at all`, () => {
		expect(ask(`a {} /* c */`, { [SPACE]: `never`, [NEWLINE]: `always` }, SPACE)).toBe(true)
	})

	it(`an at-rule the neighbour's secondary option passes over, which writes nothing there either`, () => {
		expect(ask(`@media print { a { color: red; } }b {}`, { [SPACE]: `always`, [NEWLINE]: [`always`, { ignoreAtRules: [`media`] }] }, SPACE)).toBe(true)
		expect(ask(`@media print { a { color: red; } }b {}`, { [SPACE]: `always`, [NEWLINE]: [`always`, { ignoreAtRules: [`supports`] }] }, SPACE)).toBe(false)
	})

	it(`a disable comment keeping the neighbour's fix off the line, which leaves it writing nothing`, () => {
		let rules = { [SPACE]: `never`, [NEWLINE]: `always` }

		expect(ask(SINGLE_LINE, rules, SPACE, { [NEWLINE]: [{ start: 1 }] })).toBe(true)
		expect(ask(SINGLE_LINE, rules, SPACE, { all: [{ start: 1, end: 1 }] })).toBe(true)
		expect(ask(SINGLE_LINE, rules, SPACE, { [NEWLINE]: [{ start: 2 }] })).toBe(false)
	})
})

/**
 * Asks the util about the first statement of a stylesheet.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @param ruleName - The asking rule's registered name.
 * @param disabledRanges - The ranges a disable comment opens, by rule name.
 * @returns What the util answers.
 */
function ask (code: string, rules: Record<string, unknown>, ruleName: string, disabledRanges?: Record<string, { start: number, end?: number }[]>): boolean {
	return writesRunBehindBrace(css, parse(code).first as AtRule | Rule, result(rules, disabledRanges), ruleName)
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @param disabledRanges - The ranges a disable comment opens, by rule name.
 * @returns The result.
 */
function result (rules: Record<string, unknown>, disabledRanges?: Record<string, { start: number, end?: number }[]>): PostcssResult {
	return { stylelint: { config: { rules }, disabledRanges } } as unknown as PostcssResult
}
