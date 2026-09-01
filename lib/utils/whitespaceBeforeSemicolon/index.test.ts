import { type AtRule, type Declaration, parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"

import { whitespaceBeforeSemicolon, writeWhitespaceBeforeSemicolon } from "./index.ts"

const NEWLINE_BEFORE = `@stylistic/declaration-block-semicolon-newline-before`
const SPACE_BEFORE = `@stylistic/declaration-block-semicolon-space-before`
const AT_RULE_SPACE_BEFORE = `@stylistic/at-rule-semicolon-space-before`

/** A block on one line. */
const SINGLE_LINE = `a { b: c; d: e }`

/** The same block over four lines. */
const MULTI_LINE = `a {\n\tb: c;\n\td: e\n}`

describe(`whitespaceBeforeSemicolon`, () => {
	it(`nothing where the configuration lists neither rule`, () => {
		expect(ask(SINGLE_LINE)).toBe(``)
		expect(ask(SINGLE_LINE, { "@stylistic/declaration-block-trailing-semicolon": `always` })).toBe(``)
	})

	it(`a line break under the newline rule's always, and a space under the space rule's`, () => {
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: `always` })).toBe(`\n`)
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `always` })).toBe(` `)
	})

	it(`the same settings given with the array a configuration lists a rule's options in`, () => {
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: [`always`] })).toBe(`\n`)
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: [`always`, {}] })).toBe(` `)
	})

	it(`nothing under a never option, whose bare semicolon is what it asks for`, () => {
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: `never-multi-line` })).toBe(``)
		expect(ask(MULTI_LINE, { [NEWLINE_BEFORE]: `never-multi-line` })).toBe(``)
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `never` })).toBe(``)
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `never-single-line` })).toBe(``)
	})

	it(`nothing under an option the rule refuses, which it runs over nothing under`, () => {
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: `always-single-line` })).toBe(``)
		expect(ask(MULTI_LINE, { [SPACE_BEFORE]: `always-multi-line` })).toBe(``)
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `sometimes` })).toBe(``)
	})

	it(`the line break of always-multi-line over a block broken over lines, and nothing over one on a line`, () => {
		expect(ask(MULTI_LINE, { [NEWLINE_BEFORE]: `always-multi-line` })).toBe(`\n`)
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: `always-multi-line` })).toBe(``)
	})

	it(`the space of always-single-line over a block on a line, and nothing over one broken over lines`, () => {
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `always-single-line` })).toBe(` `)
		expect(ask(MULTI_LINE, { [SPACE_BEFORE]: `always-single-line` })).toBe(``)
	})

	it(`the rule the configuration lists later, where both ask for something, since that is the one that runs last`, () => {
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `always`, [NEWLINE_BEFORE]: `always` })).toBe(`\n`)
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: `always`, [SPACE_BEFORE]: `always` })).toBe(` `)
	})

	it(`nothing under a never option listed later, which strips over the file's own semicolons whatever the earlier rule wrote`, () => {
		expect(ask(MULTI_LINE, { [NEWLINE_BEFORE]: `always`, [SPACE_BEFORE]: `never` })).toBe(``)
		expect(ask(MULTI_LINE, { [SPACE_BEFORE]: `always`, [NEWLINE_BEFORE]: `never-multi-line` })).toBe(``)
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: `always`, [SPACE_BEFORE]: `never-single-line` })).toBe(``)
	})

	it(`the rule listed earlier, where the later one is silent about this block`, () => {
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `always`, [NEWLINE_BEFORE]: `always-multi-line` })).toBe(` `)
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `always`, [NEWLINE_BEFORE]: `never-multi-line` })).toBe(` `)
		expect(ask(MULTI_LINE, { [NEWLINE_BEFORE]: `always`, [SPACE_BEFORE]: `never-single-line` })).toBe(`\n`)
	})

	it(`the last-listed speaking rule whose fix is turned on, past one turned off behind it`, () => {
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `always`, [NEWLINE_BEFORE]: [`always`, { disableFix: true }] })).toBe(` `)
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: [`always`, { disableFix: true }], [SPACE_BEFORE]: `always` })).toBe(` `)
	})

	it(`the ask of a turned-off rule where no live one speaks, written as this writer's own text`, () => {
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: [`always`, { disableFix: true }] })).toBe(` `)
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: [`always`, { disableFix: true }] })).toBe(`\n`)
		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: [`always`, { disableFix: true }], [NEWLINE_BEFORE]: [`always`, { disableFix: true }] })).toBe(`\n`)
	})

	it(`the break the linebreaks rule asks for, wherever the configuration lists it`, () => {
		expect(ask(SINGLE_LINE, { [NEWLINE_BEFORE]: `always`, "@stylistic/linebreaks": `windows` })).toBe(`\r\n`)
		expect(ask(`a {\r\n\tb: c;\r\n\td: e\r\n}`, { [NEWLINE_BEFORE]: `always` })).toBe(`\r\n`)
	})

	it(`the space rule of at-rules behind a bodiless at-rule, and neither rule of declarations`, () => {
		expect(askAtRule(`a { @foo bar }`, { [AT_RULE_SPACE_BEFORE]: `always` })).toBe(` `)
		expect(askAtRule(`a { @foo bar }`, { [AT_RULE_SPACE_BEFORE]: [`always`] })).toBe(` `)
		expect(askAtRule(`a { @foo bar }`, { [AT_RULE_SPACE_BEFORE]: `never` })).toBe(``)
		expect(askAtRule(`a { @foo bar }`, { [AT_RULE_SPACE_BEFORE]: `always-single-line` })).toBe(``)
		expect(askAtRule(`a { @foo bar }`, { [NEWLINE_BEFORE]: `always`, [SPACE_BEFORE]: `always` })).toBe(``)
		expect(askAtRule(`a { @foo bar }`)).toBe(``)
		expect(ask(SINGLE_LINE, { [AT_RULE_SPACE_BEFORE]: `always` })).toBe(``)
	})

	it(`nothing behind an at-rule the syntax does not read as standard CSS, which the space rule of at-rules passes over`, () => {
		let refusing: Syntax = { ...css, isStandardAtRule: () => false }

		expect(askAtRule(`a { @foo bar }`, { [AT_RULE_SPACE_BEFORE]: `always` }, refusing)).toBe(``)
	})

	it(`the rules of the asking rule's own namespace, and not the core's, which refuse the file the namespace reads`, () => {
		let scss: Syntax = { ...css, namespace: `scss` }

		expect(ask(SINGLE_LINE, { [SPACE_BEFORE]: `always` }, scss)).toBe(``)
		expect(ask(SINGLE_LINE, { "@stylistic/scss/declaration-block-semicolon-space-before": `always` }, scss)).toBe(` `)
		expect(ask(SINGLE_LINE, { "@stylistic/scss/declaration-block-semicolon-newline-before": `always` })).toBe(``)
		expect(askAtRule(`a { @foo bar }`, { "@stylistic/scss/at-rule-semicolon-space-before": `always` }, scss)).toBe(` `)
		expect(askAtRule(`a { @foo bar }`, { [AT_RULE_SPACE_BEFORE]: `always` }, scss)).toBe(``)
	})
})

describe(`writeWhitespaceBeforeSemicolon`, () => {
	it(`onto the end of the value, over the whitespace it ends with`, () => {
		let decl = lastDeclarationOf(`a { b: c }`)

		writeWhitespaceBeforeSemicolon(css, decl, ` `)
		expect(decl.value).toBe(`c `)

		writeWhitespaceBeforeSemicolon(css, decl, `\n`)
		expect(decl.value).toBe(`c\n`)
	})

	it(`into the raw of the flag, where the declaration carries one, spelled as the file spells it`, () => {
		let exact = lastDeclarationOf(`a { b: c !important }`)
		let spaced = lastDeclarationOf(`a { b: c ! important }`)

		writeWhitespaceBeforeSemicolon(css, exact, ` `)
		writeWhitespaceBeforeSemicolon(css, spaced, `\n`)
		expect(exact.raws.important).toBe(` !important `)
		expect(spaced.raws.important).toBe(` ! important\n`)
		expect(exact.value).toBe(`c`)
	})

	it(`into the raw between a bodiless at-rule's parameters and its semicolon, over the whitespace it ends with`, () => {
		let tight = lastAtRuleOf(`a { @foo bar; }`)
		let spaced = lastAtRuleOf(`a { @foo bar\t; }`)

		writeWhitespaceBeforeSemicolon(css, tight, ` `)
		writeWhitespaceBeforeSemicolon(css, spaced, ` `)
		expect(tight.raws.between).toBe(` `)
		expect(spaced.raws.between).toBe(` `)
		expect(tight.params).toBe(`bar`)
	})

	it(`over a value that is nothing but whitespace`, () => {
		let decl = lastDeclarationOf(`a { --b: }`)

		writeWhitespaceBeforeSemicolon(css, decl, `\n`)
		expect(decl.value).toBe(`\n`)
	})
})

/**
 * Reads the whitespace a fix would write in front of a semicolon behind the last declaration of a stylesheet's first rule.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists, in the order it lists them.
 * @param syntax - The syntax the asking rule is built over.
 * @returns The whitespace.
 */
function ask (code: string, rules: Record<string, unknown> = {}, syntax: Syntax = css): string {
	return whitespaceBeforeSemicolon(syntax, lastDeclarationOf(code), result(rules))
}

/**
 * Reads the whitespace a fix would write in front of a semicolon behind the last at-rule of a stylesheet's first rule.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists, in the order it lists them.
 * @param syntax - The syntax the asking rule is built over.
 * @returns The whitespace.
 */
function askAtRule (code: string, rules: Record<string, unknown> = {}, syntax: Syntax = css): string {
	return whitespaceBeforeSemicolon(syntax, lastAtRuleOf(code), result(rules))
}

/**
 * Parses a stylesheet and picks the last declaration of its first rule.
 * @param code - The stylesheet.
 * @returns The declaration.
 */
function lastDeclarationOf (code: string): Declaration {
	return (parse(code).first as Rule).last as Declaration
}

/**
 * Parses a stylesheet and picks the last at-rule of its first rule.
 * @param code - The stylesheet.
 * @returns The at-rule.
 */
function lastAtRuleOf (code: string): AtRule {
	return (parse(code).first as Rule).last as AtRule
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @returns The result.
 */
function result (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}
