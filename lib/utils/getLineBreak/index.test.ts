import { parse, type Rule, rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { getLineBreak } from "./index.ts"

describe(`getLineBreak`, () => {
	it(`the linebreaks rule, whose setting wins over whatever the file spells its lines with`, () => {
		expect(ask(`a {}\nb {}`, { "@stylistic/linebreaks": `windows` })).toBe(`\r\n`)
		expect(ask(`a {}\r\nb {}`, { "@stylistic/linebreaks": `unix` })).toBe(`\n`)
	})

	it(`the same setting given with the array a configuration lists a rule's options in`, () => {
		expect(ask(`a {}\nb {}`, { "@stylistic/linebreaks": [`windows`] })).toBe(`\r\n`)
		expect(ask(`a {}\r\nb {}`, { "@stylistic/linebreaks": [`unix`, {}] })).toBe(`\n`)
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
		expect(getLineBreak(rule({ selector: `a` }), result())).toBe(`\n`)
	})

	it(`a bare carriage return or a form feed, which is whitespace and no break, so that the file ends no line on it`, () => {
		expect(ask(`a {}\rb {}`)).toBe(`\n`)
		expect(ask(`a {}\fb {}`)).toBe(`\n`)
		expect(ask(`a {}\rb {}\r\nc {}`)).toBe(`\r\n`)
	})
})

/**
 * Reads the break a fix would write into a stylesheet.
 * @param css - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @returns The break.
 */
function ask (css: string, rules: Record<string, unknown> = {}): string {
	let root = parse(css)

	return getLineBreak(root.first as Rule, result(rules))
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @returns The result.
 */
function result (rules: Record<string, unknown> = {}): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}
