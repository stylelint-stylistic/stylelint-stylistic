import postcss, { type AtRule, type Parser } from "postcss"
import postcssLess from "postcss-less"
import postcssScss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { isStandardSyntaxAtRule } from "./index.ts"

describe(`isStandardSyntaxAtRule`, () => {
	it(`non nested at-rules without quotes`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@charset UTF-8;`))).toBe(true)
	})

	it(`non nested at-rules with \`'\` quotes`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@charset 'UTF-8';`))).toBe(true)
	})

	it(`non nested at-rules with \`"\` quotes`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@charset "UTF-8";`))).toBe(true)
	})

	it(`non nested at-rules with \`'\` quotes and without space after name`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@charset'UTF-8';`))).toBe(true)
	})

	it(`non nested at-rules with \`"\` quotes and without space after name`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@charset"UTF-8";`))).toBe(true)
	})

	it(`non nested at-rules with function and without space after name`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@import url("fineprint.css") print;`))).toBe(true)
	})

	it(`nested at-rules`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@media (min-width: 100px) {};`))).toBe(true)
	})

	it(`nested at-rules with newline after name`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@media\n(min-width: 100px) {};`))).toBe(true)
	})

	it(`nested at-rules with windows newline after name`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@media\r\n(min-width: 100px) {};`))).toBe(true)
	})

	it(`nested at-rules without space after name`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@media(min-width: 100px) {};`))).toBe(true)
	})

	it(`ignore \`@content\` inside mixins space`, () => {
		let rules = scssAtRules(`@mixin mixin() { @content; };`)

		expect(rules.length).toBe(2)
		expect(rules.map((rule) => rule.name)).toStrictEqual([
			`mixin`,
			`content`,
		])
		expect(isStandardSyntaxAtRule(rules[0])).toBe(true)
		expect(isStandardSyntaxAtRule(rules[1])).toBe(false)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
	it(`at-rules spelled without a space in front of their options, which Less compiles as at-rules`, () => {
		let spellings = [
			`a { @import(reference) "x"; }`,
			`a { @supports(a: b); }`,
			`a { @layer(l); }`,
			`a { @plugin(args) "p"; }`,
			`a { @whatever(x); }`,
		]

		for (let spelling of spellings) expect(isStandardSyntaxAtRule(lessAtRules(spelling)[0])).toBe(true)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
	it(`a call to a detached ruleset spelled with a space in front of its parentheses, which Less reads as an at-rule`, () => {
		let rules = lessAtRules(`@detached-ruleset: { background: red; }; .top { @detached-ruleset (); }`)

		expect(rules.length).toBe(2)
		expect(isStandardSyntaxAtRule(rules[1])).toBe(true)
	})

	it(`ignore passing rulesets to mixins`, () => {
		let rules = lessAtRules(
			`@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`,
		)

		expect(rules.length).toBe(2)
		expect(isStandardSyntaxAtRule(rules[0])).toBe(false)
		expect(isStandardSyntaxAtRule(rules[1])).toBe(false)
	})

	it(`ignore calling of mixins`, () => {
		let rules = lessAtRules(`a { .mixin(); }`)

		expect(rules.length).toBe(1)
		expect(isStandardSyntaxAtRule(rules[0])).toBe(false)
	})

	it(`ignore variables`, () => {
		let rules = lessAtRules(`@my-variable: 10px; .top { margin-top: @my-variable; }`)

		expect(rules.length).toBe(1)
		expect(isStandardSyntaxAtRule(rules[0])).toBe(false)
	})
})

/**
 * Reads every at-rule of a stylesheet.
 * @param code - The stylesheet.
 * @param parser - The syntax to read it with.
 * @returns The at-rules, in the order the walk meets them.
 */
function atRules (code: string, parser: { parse: Parser } = postcss): AtRule[] {
	let rules: AtRule[] = []

	parser.parse(code).walkAtRules((rule) => {
		rules.push(rule)
	})

	return rules
}

/**
 * Reads the first at-rule of a stylesheet.
 * @param code - The stylesheet.
 * @returns That at-rule.
 */
function atRule (code: string): AtRule {
	return atRules(code)[0]
}

/**
 * Reads every at-rule of a stylesheet written in SCSS.
 * @param code - The stylesheet.
 * @returns The at-rules.
 */
function scssAtRules (code: string): AtRule[] {
	return atRules(code, postcssScss)
}

/**
 * Reads every at-rule of a stylesheet written in Less.
 * @param code - The stylesheet.
 * @returns The at-rules.
 */
function lessAtRules (code: string): AtRule[] {
	return atRules(code, postcssLess)
}
