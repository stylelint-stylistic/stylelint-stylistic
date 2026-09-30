import { type Declaration, parse, type Rule, rule as buildRule } from "postcss"
import { describe, expect, it } from "vitest"

import { braceIndex, indexInFrontOfTheBrace } from "./index.ts"

/**
 * Parses a snippet and reads its first rule with the print of that rule.
 * @param code - The snippet.
 * @returns The rule and its print.
 */
function firstRule (code: string): { rule: Rule, print: string } {
	let rule = parse(code).first as Rule

	return { rule, print: rule.toString() }
}

/**
 * Builds a rule holding one declaration, as another rule builds one, with no place in the file.
 * @param linebreak - The break in front of the brace.
 * @returns The rule and its print.
 */
function builtRule (linebreak: string): { rule: Rule, print: string } {
	let rule = buildRule({ selector: `a`, raws: { after: linebreak } })

	rule.append({ prop: `b`, value: `c` })

	return { rule, print: rule.toString() }
}

describe(`braceIndex`, () => {
	it(`counts the closing brace from the node's start`, () => {
		let { rule, print } = firstRule(`a {\n  b: c;\n}\n`)

		expect(braceIndex(rule, print)).toBe(print.length - 1)
		expect(braceIndex(rule, print)).toBe(12)
	})

	it(`finds the brace in front of a stray semicolon PostCSS files behind it`, () => {
		let { rule, print } = firstRule(`a { b: c } ;`)
		let throughTheBrace = print.slice(0, -2)

		expect(throughTheBrace).toBe(`a { b: c }`)
		expect(braceIndex(rule, throughTheBrace)).toBe(9)
	})

	it(`counts over the print, read through the brace, where the parser gives no end`, () => {
		let { rule, print } = firstRule(`a { b: c } ;`)

		delete rule.source?.end

		expect(braceIndex(rule, print.slice(0, -2))).toBe(9)
	})

	it(`counts a nested rule's brace from that rule's start`, () => {
		let outer = parse(`a {\n  b {\n    c: d;\n  }\n}\n`).first as Rule
		let inner = outer.first as Rule

		expect(braceIndex(inner, inner.toString())).toBe(inner.toString().length - 1)
		expect(braceIndex(outer, outer.toString())).toBe(outer.toString().length - 1)
	})

	// A rule listed earlier took characters out in front of the brace: the index is the file's, not the print's
	it(`is the file's index where the print has been rewritten`, () => {
		let { rule } = firstRule(`a {\n  b: c;  \n\n}\n`)

		rule.raws.after = `\n`
		delete (rule.first as Declaration).raws.value

		let print = rule.toString()

		expect(print).toBe(`a {\n  b: c;\n}`)
		expect(braceIndex(rule, print)).toBe(15)
	})

	// `report` drops the index of a node holding no place, so nothing but this case reads the value
	it(`counts over the print where the node holds no place in the file`, () => {
		let { rule, print } = builtRule(`\n`)

		expect(braceIndex(rule, print)).toBe(print.length - 1)
	})
})

describe(`indexInFrontOfTheBrace`, () => {
	it(`is the character in front of the brace`, () => {
		let { rule, print } = firstRule(`a {\n  b: c;\n}\n`)

		expect(indexInFrontOfTheBrace(rule, print)).toBe(11)
	})

	it(`is the carriage return of a CRLF break in front of the brace`, () => {
		let { rule, print } = firstRule(`a {\r\n  b: c;\r\n}\r\n`)

		expect(indexInFrontOfTheBrace(rule, print)).toBe(12)
		expect(print[12]).toBe(`\r`)
	})

	it(`is the file's character where the print has been rewritten`, () => {
		let { rule } = firstRule(`a {\r\n  b: c;  \r\n\r\n}\r\n`)

		rule.raws.after = `\r\n`
		delete (rule.first as Declaration).raws.value

		let print = rule.toString()

		expect(print).toBe(`a {\r\n  b: c;\r\n}`)
		expect(indexInFrontOfTheBrace(rule, print)).toBe(16)
	})

	it(`counts over the print, read through the brace, where the parser gives no end`, () => {
		let { rule, print } = firstRule(`a {\r\n  b: c;\r\n} ;`)

		delete rule.source?.end

		expect(indexInFrontOfTheBrace(rule, print.slice(0, -2))).toBe(12)
	})

	// `report` drops the index of a node holding no place, so nothing but this case reads the value
	it(`counts over the print, the carriage return of a CRLF break there too, where the node holds no place in the file`, () => {
		let { rule, print } = builtRule(`\r\n`)

		expect(print.endsWith(`\r\n}`)).toBe(true)
		expect(indexInFrontOfTheBrace(rule, print)).toBe(print.length - 3)
	})
})
