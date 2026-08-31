import postcss, { type AtRule, type Parser } from "postcss"
import postcssScss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"

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
		expect(isStandardSyntaxAtRule(pick(rules, 0))).toBe(true)
		expect(isStandardSyntaxAtRule(pick(rules, 1))).toBe(false)
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
	return pick(atRules(code))
}

/**
 * Reads every at-rule of a stylesheet written in SCSS.
 * @param code - The stylesheet.
 * @returns The at-rules.
 */
function scssAtRules (code: string): AtRule[] {
	return atRules(code, postcssScss)
}
