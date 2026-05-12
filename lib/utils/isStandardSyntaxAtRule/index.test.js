import postcss from "postcss"
import postcssLess from "postcss-less"
import postcssScss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { isStandardSyntaxAtRule } from "./index.js"

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

function atRules (code, parser = postcss) {
	let rules = []

	parser.parse(code).walkAtRules((rule) => rules.push(rule))

	return rules
}

function atRule (code) {
	return atRules(code)[0]
}

function scssAtRules (code) {
	return atRules(code, postcssScss)
}

function lessAtRules (code) {
	return atRules(code, postcssLess)
}
