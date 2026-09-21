import { parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { LEADING_LINE_BREAK } from "../../regexps.ts"
import { closingBraceTwinReadings } from "../closingBraceTwinReadings/index.ts"
import { openingBraceTwinReadings } from "../openingBraceTwinReadings/index.ts"

import { runBehind, runInFront, type TwinRun, writesTwinRun } from "./index.ts"

const SPACE = `@stylistic/selector-list-comma-space-after`
const NEWLINE = `@stylistic/selector-list-comma-newline-after`
const CLOSING_SPACE = `@stylistic/block-closing-brace-space-before`
const CLOSING_NEWLINE = `@stylistic/block-closing-brace-newline-before`
const OPENING_SPACE = `@stylistic/block-opening-brace-space-after`
const OPENING_NEWLINE = `@stylistic/block-opening-brace-newline-after`

describe(`writesTwinRun`, () => {
	it(`a configuration listing the asking rule alone, or neither twin`, () => {
		expect(ask(`a, b {}`, { [SPACE]: `never` }, SPACE)).toBe(true)
		expect(ask(`a, b {}`, { "@stylistic/color-hex-case": `lower` }, NEWLINE)).toBe(true)
		expect(ask(`a, b {}`, {}, NEWLINE)).toBe(true)
	})

	it(`a rule that has no twin`, () => {
		expect(writesTwinRun(`color-hex-case`, `@stylistic/color-hex-case`, parse(`a, b {}`), result({ [SPACE]: `always`, [NEWLINE]: `always` }), twinRun(`a, b`))).toBe(true)
	})

	it(`two options that accept no spelling in common, where the rule the configuration lists later is the one to write`, () => {
		expect(ask(`a,b {}`, { [SPACE]: `always`, [NEWLINE]: `always` }, SPACE)).toBe(false)
		expect(ask(`a,b {}`, { [SPACE]: `always`, [NEWLINE]: `always` }, NEWLINE)).toBe(true)
		expect(ask(`a,b {}`, { [NEWLINE]: `always`, [SPACE]: `always` }, NEWLINE)).toBe(false)
		expect(ask(`a,b {}`, { [NEWLINE]: `always`, [SPACE]: `always` }, SPACE)).toBe(true)
	})

	it(`a never option against an always one, which accept nothing in common either`, () => {
		expect(ask(`a, b {}`, { [SPACE]: `never`, [NEWLINE]: `always` }, SPACE)).toBe(false)
		expect(ask(`a, b {}`, { [NEWLINE]: `always`, [SPACE]: `never` }, SPACE)).toBe(true)
	})

	it(`two never options, which both leave nothing`, () => {
		let rules = { [SPACE]: `never`, [NEWLINE]: `never-multi-line` }

		expect(ask(`a,\nb {}`, rules, SPACE)).toBe(true)
		expect(ask(`a,\nb {}`, rules, NEWLINE)).toBe(true)
	})

	it(`a rule ahead that was content with the run as it stood and refuses what the write leaves, which keeps the write out`, () => {
		expect(ask(`a, b {}`, { [SPACE]: `always`, [NEWLINE]: `always` }, NEWLINE)).toBe(false)
		expect(ask(`a,\nb {}`, { [NEWLINE]: `always`, [SPACE]: `always` }, SPACE)).toBe(false)
	})

	it(`a rule ahead that refused the run as it stood, which has warned already and frees the write`, () => {
		expect(ask(`a,  b {}`, { [SPACE]: `always`, [NEWLINE]: `always` }, NEWLINE)).toBe(true)
	})

	it(`a neighbour whose lineness option says nothing of the list the write leaves, which gates nothing`, () => {
		expect(ask(`a,b {}`, { [SPACE]: `always`, [NEWLINE]: `always-multi-line` }, SPACE)).toBe(true)
		expect(ask(`a,\nb {}`, { [NEWLINE]: `never-multi-line`, [SPACE]: `always` }, SPACE)).toBe(true)
		expect(ask(`a,b {}`, { [NEWLINE]: `always`, [SPACE]: `always-single-line` }, NEWLINE)).toBe(true)
	})

	it(`a list another break keeps on several lines, where the neighbour's lineness option still speaks`, () => {
		expect(ask(`a,b\n.c {}`, { [SPACE]: `always`, [NEWLINE]: `always-multi-line` }, SPACE)).toBe(false)
	})

	it(`the breaks of every run the rule writes, which leave the list on one line only once all are written`, () => {
		expect(ask(`a,\nb,\nc {}`, { [SPACE]: `always`, [NEWLINE]: `always-multi-line` }, SPACE)).toBe(true)
	})

	it(`two deferred options, the break rule ahead, whose write the neighbour's own write silences, which costs the asking rule nothing`, () => {
		let rules = { [SPACE]: `always-single-line`, [NEWLINE]: `never-multi-line` }

		expect(ask(`a,\nb {}`, rules, NEWLINE)).toBe(true)
		expect(ask(`a,\nb {}`, rules, SPACE)).toBe(true)
	})

	it(`a neighbour whose fix the configuration turned off, which rewrites nothing and so gates nothing behind`, () => {
		expect(ask(`a,b {}`, { [SPACE]: `always`, [NEWLINE]: [`always`, { disableFix: true }] }, SPACE)).toBe(true)
	})

	it(`a neighbour ahead whose fix is off, which still stays silent about the run it was content with`, () => {
		expect(ask(`a, b {}`, { [SPACE]: [`always`, { disableFix: true }], [NEWLINE]: `always` }, NEWLINE)).toBe(false)
	})

	it(`a neighbour listed under an option it does not accept, which is no neighbour at all`, () => {
		expect(ask(`a,b {}`, { [SPACE]: `always`, [NEWLINE]: `never` }, SPACE)).toBe(true)
	})

	it(`a neighbour that reads another run at this delimiter, which contends for nothing`, () => {
		expect(ask(`a,b {}`, { [SPACE]: `always`, [NEWLINE]: `always` }, SPACE, { twinWrites: () => false })).toBe(true)
	})

	it(`a neighbour whose own fix guards leave it no write, which gates nothing behind and still judged the run ahead`, () => {
		expect(ask(`a,b {}`, { [SPACE]: `always`, [NEWLINE]: `always` }, SPACE, { twinFixes: () => false })).toBe(true)
		expect(ask(`a,\nb {}`, { [NEWLINE]: `always`, [SPACE]: `always` }, SPACE, { twinFixes: () => false })).toBe(false)
	})

	it(`a neighbour that reads past a comment only while whitespace stands in front of it, which the write takes away`, () => {
		let pastComment: Partial<TwinRun> = { twinWrites: (_option, _secondary, over) => over === `` }

		expect(ask(`a, b {}`, { [SPACE]: `never`, [NEWLINE]: `always` }, SPACE, pastComment)).toBe(false)
		expect(ask(`a, b {}`, { [NEWLINE]: `always`, [SPACE]: `never` }, SPACE, pastComment)).toBe(false)
	})

	it(`a neighbour ahead that read another run, which warned about nothing here`, () => {
		expect(ask(`a,  b {}`, { [NEWLINE]: `always`, [SPACE]: `never` }, SPACE, { twinWrites: (_option, _secondary, over) => over === `` })).toBe(false)
		expect(ask(`a,  b {}`, { [SPACE]: `always`, [NEWLINE]: `always` }, NEWLINE, { twinWrites: (_option, _secondary, over) => over === `\n` })).toBe(false)
	})

	it(`a neighbour ahead that the write moves off this run, behind a comment or past the delimiter, which reads nothing the write leaves`, () => {
		expect(ask(`a,\nb {}`, { [NEWLINE]: `always`, [SPACE]: `always` }, SPACE, { twinWrites: (_option, _secondary, over) => over !== ` ` })).toBe(true)
	})

	it(`the neighbour's secondaries, handed to the question of whether it writes the run`, () => {
		let seen: Record<string, unknown>[] = []

		ask(`a,b {}`, { [SPACE]: `always`, [NEWLINE]: [`always`, { ignore: `x` }] }, SPACE, { twinWrites: (_option, secondary) => seen.push(secondary) > 0 })

		expect(seen).toEqual([{ ignore: `x` }])
	})

	it(`a disable comment keeping the neighbour's fix off the line, which leaves it writing nothing`, () => {
		let rules = { [SPACE]: `always`, [NEWLINE]: `always` }

		expect(ask(`a,b {}`, rules, SPACE, {}, { [NEWLINE]: [{ start: 1 }] })).toBe(true)
		expect(ask(`a,b {}`, rules, SPACE, {}, { all: [{ start: 1, end: 1 }] })).toBe(true)
		expect(ask(`a,b {}`, rules, SPACE, {}, { [NEWLINE]: [{ start: 2 }] })).toBe(false)
	})

	it(`a copy of the twin under a namespace reading the root, which writes the same run`, () => {
		expect(ask(`a,b {}`, { [SPACE]: `always`, "@stylistic/scss/selector-list-comma-newline-after": `always` }, SPACE)).toBe(false)
	})

	it(`the runs on either side of a delimiter`, () => {
		expect(runBehind(`a,\n\tb`, 1)).toBe(`\n\t`)
		expect(runBehind(`a,b`, 1)).toBe(``)
		expect(runInFront(`a \n,b`, 3)).toBe(` \n`)
		expect(runInFront(`a,b`, 1)).toBe(``)
	})
})

// See 1789979881
describe(`the twin gate over a run the readings judge`, () => {
	it(`a break the twin behind would write over, leaving a run the asking rule refuses`, () => {
		expect(askClosingBrace(`a { b: c; ;\n}`, { [CLOSING_NEWLINE]: `always`, [CLOSING_SPACE]: `always` }, CLOSING_NEWLINE)).toBe(false)
		expect(askClosingBrace(`a { b: c; ;\n}`, { [CLOSING_NEWLINE]: `always`, [CLOSING_SPACE]: `never` }, CLOSING_NEWLINE)).toBe(false)
	})

	it(`a space the twin behind would put a break in front of, which the asking rule refuses behind a break`, () => {
		expect(askClosingBrace(`a { b: c;;\n}`, { [CLOSING_SPACE]: `always`, [CLOSING_NEWLINE]: `always` }, CLOSING_SPACE)).toBe(false)
	})

	it(`a twin ahead that was content with the run as it stood and refuses what the write leaves`, () => {
		expect(askClosingBrace(`a { b: c;;\n}`, { [CLOSING_NEWLINE]: `always`, [CLOSING_SPACE]: `always` }, CLOSING_SPACE)).toBe(false)
		expect(askClosingBrace(`a { b: c;; }`, { [CLOSING_SPACE]: `always`, [CLOSING_NEWLINE]: `always` }, CLOSING_NEWLINE)).toBe(false)
	})

	it(`a twin ahead that warned about the run as it stood, which the write takes nothing from`, () => {
		expect(askClosingBrace(`a { b: c; ;\n}`, { [CLOSING_NEWLINE]: `always`, [CLOSING_SPACE]: `always` }, CLOSING_SPACE)).toBe(true)
	})

	it(`a write both twins accept, the break standing in front of the semicolon and the space behind it`, () => {
		expect(askClosingBrace(`a { b: c; ; }`, { [CLOSING_NEWLINE]: `always`, [CLOSING_SPACE]: `always` }, CLOSING_NEWLINE)).toBe(true)
		expect(askClosingBrace(`a { b: c; ; }`, { [CLOSING_SPACE]: `always`, [CLOSING_NEWLINE]: `always` }, CLOSING_NEWLINE)).toBe(true)
		expect(askClosingBrace(`a { b: c;\n ;\n}`, { [CLOSING_SPACE]: `always`, [CLOSING_NEWLINE]: `always` }, CLOSING_SPACE)).toBe(true)
	})

	it(`a twin behind that refuses the write and whose own write over it leaves a run the asking rule accepts`, () => {
		// The space rule's never leaves the semicolon against the brace, and the break the twin then puts in front of the run's first whitespace stands in front of that semicolon
		expect(askClosingBrace(`a { b: c; ; }`, { [CLOSING_SPACE]: `never`, [CLOSING_NEWLINE]: `always` }, CLOSING_SPACE)).toBe(true)
	})

	it(`a twin whose option says nothing of the block the write leaves`, () => {
		expect(askClosingBrace(`a { b: c; ;\n}`, { [CLOSING_NEWLINE]: `always`, [CLOSING_SPACE]: `always-single-line` }, CLOSING_NEWLINE)).toBe(true)
		expect(askClosingBrace(`a { b: c;; }`, { [CLOSING_SPACE]: `never`, [CLOSING_NEWLINE]: `always-multi-line` }, CLOSING_SPACE)).toBe(true)
	})

	it(`a twin whose fix is turned off, which rewrites nothing behind and still judges ahead`, () => {
		expect(askClosingBrace(`a { b: c; ;\n}`, { [CLOSING_NEWLINE]: `always`, [CLOSING_SPACE]: [`always`, { disableFix: true }] }, CLOSING_NEWLINE)).toBe(true)
		expect(askClosingBrace(`a { b: c;;\n}`, { [CLOSING_NEWLINE]: [`always`, { disableFix: true }], [CLOSING_SPACE]: `always` }, CLOSING_SPACE)).toBe(false)
	})
})

// See 1790006583
describe(`the twin gate over a run behind an opening brace that holds a stray semicolon`, () => {
	it(`two always options, which read the same first character and accept no run in common: the one that runs last writes`, () => {
		expect(askOpeningBrace(`a{;b:c}`, { [OPENING_SPACE]: `always`, [OPENING_NEWLINE]: `always` }, OPENING_SPACE)).toBe(false)
		expect(askOpeningBrace(`a{;b:c}`, { [OPENING_SPACE]: `always`, [OPENING_NEWLINE]: `always` }, OPENING_NEWLINE)).toBe(true)
	})

	it(`a twin ahead that was content with the run as it stood and refuses what the write leaves`, () => {
		expect(askOpeningBrace(`a{ ;b:c}`, { [OPENING_SPACE]: `always`, [OPENING_NEWLINE]: `always` }, OPENING_NEWLINE)).toBe(false)
		expect(askOpeningBrace(`a{\n;b:c}`, { [OPENING_NEWLINE]: `always`, [OPENING_SPACE]: `never` }, OPENING_SPACE)).toBe(false)
	})

	it(`an option that waits for the run's end, which runs behind the twin whatever the configuration lists`, () => {
		expect(askOpeningBrace(`a {;\nb: c;}`, { [OPENING_NEWLINE]: `always-multi-line`, [OPENING_SPACE]: `always` }, OPENING_SPACE)).toBe(false)
		expect(askOpeningBrace(`a {;\nb: c;}`, { [OPENING_NEWLINE]: `always-multi-line`, [OPENING_SPACE]: `always` }, OPENING_NEWLINE)).toBe(true)
	})

	it(`two never options, which both take the whitespace the run opens with and leave the same run`, () => {
		expect(askOpeningBrace(`a {\n ;\nb: c;}`, { [OPENING_SPACE]: `never`, [OPENING_NEWLINE]: `never-multi-line` }, OPENING_SPACE)).toBe(true)
		expect(askOpeningBrace(`a {\n ;\nb: c;}`, { [OPENING_SPACE]: `never`, [OPENING_NEWLINE]: `never-multi-line` }, OPENING_NEWLINE)).toBe(true)
	})

	it(`a twin whose option says nothing of the block the write leaves`, () => {
		expect(askOpeningBrace(`a{;b:c}`, { [OPENING_NEWLINE]: `always`, [OPENING_SPACE]: `always-single-line` }, OPENING_NEWLINE)).toBe(true)
	})
})

/**
 * Describes the run behind the first comma of a selector list.
 * @param selector - The list.
 * @param overrides - Fields replacing the ones read off the list.
 * @returns The run.
 */
function twinRun (selector: string, overrides: Partial<TwinRun> = {}): TwinRun {
	let commas = [...selector.matchAll(/,/gu)].map(({ index }) => index)

	return {
		side: `after`,
		run: runBehind(selector, commas[0] as number),
		lineText: selector,
		runs: () => commas.map((each) => runBehind(selector, each)),
		line: 1,
		twinWrites: () => true,
		...overrides,
	}
}

/**
 * Asks the util about the first comma of the first rule of a stylesheet, for one of the two `selector-list-comma-*-after` rules.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @param ruleName - The asking rule's registered name.
 * @param overrides - Fields replacing the ones read off the selector.
 * @param disabledRanges - The ranges a disable comment opens, by rule name.
 * @returns What the util answers.
 */
function ask (code: string, rules: Record<string, unknown>, ruleName: string, overrides: Partial<TwinRun> = {}, disabledRanges?: Record<string, { start: number, end?: number }[]>): boolean {
	let node = parse(code).first as Rule
	let shortName = ruleName.slice(ruleName.lastIndexOf(`/`) + 1)

	return writesTwinRun(shortName, ruleName, node, result(rules, disabledRanges), twinRun(node.selector, overrides))
}

/**
 * Asks the twin gate about the run in front of the closing brace of the first rule of a stylesheet, the way the two rules hand it over.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @param ruleName - The asking rule's registered name.
 * @returns What the gate answers.
 */
function askClosingBrace (code: string, rules: Record<string, unknown>, ruleName: string): boolean {
	let node = parse(code).first as Rule
	let run = node.raws.after ?? ``
	let text = node.toString()

	return writesTwinRun(ruleName.slice(ruleName.lastIndexOf(`/`) + 1), ruleName, node, result(rules), {
		side: `before`,
		run,
		lineText: text.slice(text.indexOf(`{`)),
		runs: () => [run],
		breakPattern: LEADING_LINE_BREAK,
		line: 1,
		twinWrites: () => true,
		readings: closingBraceTwinReadings(() => `\n`),
	})
}

/**
 * Asks the twin gate about the run behind the opening brace of the first rule of a stylesheet, the way the two rules hand it over.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @param ruleName - The asking rule's registered name.
 * @returns What the gate answers.
 */
function askOpeningBrace (code: string, rules: Record<string, unknown>, ruleName: string): boolean {
	let node = parse(code).first as Rule
	let run = node.first?.raws.before ?? ``
	let text = node.toString()

	return writesTwinRun(ruleName.slice(ruleName.lastIndexOf(`/`) + 1), ruleName, node, result(rules), {
		side: `after`,
		run,
		lineText: text.slice(text.indexOf(`{`)),
		runs: () => [run],
		line: 1,
		twinWrites: () => true,
		readings: openingBraceTwinReadings(() => `\n`),
	})
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
