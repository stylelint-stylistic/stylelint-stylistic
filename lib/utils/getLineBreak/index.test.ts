import { parse, type Rule, rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"

import { getLineBreak } from "./index.ts"

/** The core's syntax with a namespace of its own, which is all a reading of the configuration can tell a namespace's syntax apart by. */
const SCSS: Syntax = { ...css, namespace: `scss` }

describe(`getLineBreak`, () => {
	it(`the linebreaks rule, whose setting wins over whatever the file spells its lines with`, () => {
		expect(ask(`a {}\nb {}`, { "@stylistic/linebreaks": `windows` })).toBe(`\r\n`)
		expect(ask(`a {}\r\nb {}`, { "@stylistic/linebreaks": `unix` })).toBe(`\n`)
	})

	it(`the same setting given with the array a configuration lists a rule's options in`, () => {
		expect(ask(`a {}\nb {}`, { "@stylistic/linebreaks": [`windows`] })).toBe(`\r\n`)
		expect(ask(`a {}\r\nb {}`, { "@stylistic/linebreaks": [`unix`, {}] })).toBe(`\n`)
	})

	it(`the rule under the asking rule's own namespace, and not under the core's name, which refuses the file the namespace reads`, () => {
		expect(ask(`a {}\nb {}`, { "@stylistic/scss/linebreaks": `windows` }, SCSS)).toBe(`\r\n`)
		expect(ask(`a {}\r\nb {}`, { "@stylistic/scss/linebreaks": [`unix`] }, SCSS)).toBe(`\n`)
		expect(ask(`a {}\nb {}`, { "@stylistic/linebreaks": `windows` }, SCSS)).toBe(`\n`)
		expect(ask(`a {}\nb {}`, { "@stylistic/scss/linebreaks": `windows` })).toBe(`\n`)
	})

	it(`the break the file ends its lines with, where the configuration lists no such rule`, () => {
		expect(ask(`a {}\nb {}`)).toBe(`\n`)
		expect(ask(`a {}\r\nb {}`)).toBe(`\r\n`)
	})

	it(`the first break of a file spelling its lines two ways`, () => {
		expect(ask(`a {}\nb {}\r\nc {}`)).toBe(`\n`)
		expect(ask(`a {}\r\nb {}\nc {}`)).toBe(`\r\n`)
	})

	it(`a line feed for a file written on one line`, () => {
		expect(ask(`a {}`)).toBe(`\n`)
	})

	it(`a line feed for a node standing in no file at all`, () => {
		expect(getLineBreak(css, rule({ selector: `a` }), result())).toBe(`\n`)
	})

	it(`a bare carriage return or a form feed, which is whitespace and no break, so that the file ends no line on it`, () => {
		expect(ask(`a {}\rb {}`)).toBe(`\n`)
		expect(ask(`a {}\fb {}`)).toBe(`\n`)
		expect(ask(`a {}\rb {}\r\nc {}`)).toBe(`\r\n`)
	})
})

/**
 * Reads the break a fix would write into a stylesheet.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @param syntax - The syntax the asking rule is built over.
 * @returns The break.
 */
function ask (code: string, rules: Record<string, unknown> = {}, syntax: Syntax = css): string {
	let root = parse(code)

	return getLineBreak(syntax, root.first as Rule, result(rules))
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @returns The result.
 */
function result (rules: Record<string, unknown> = {}): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}
