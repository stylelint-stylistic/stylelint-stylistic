import { deepEqual, equal } from "node:assert/strict"
import { describe, it } from "node:test"

import postcss from "postcss"
import postcssLess from "postcss-less"
import postcssScss from "postcss-scss"

import isStandardSyntaxAtRule from "./isStandardSyntaxAtRule.js"

describe(`isStandardSyntaxAtRule`, () => {
	it(`non nested at-rules without quotes`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@charset UTF-8;`)), true)
	})

	it(`non nested at-rules with \`'\` quotes`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@charset 'UTF-8';`)), true)
	})

	it(`non nested at-rules with \`"\` quotes`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@charset "UTF-8";`)), true)
	})

	it(`non nested at-rules with \`'\` quotes and without space after name`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@charset'UTF-8';`)), true)
	})

	it(`non nested at-rules with \`"\` quotes and without space after name`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@charset"UTF-8";`)), true)
	})

	it(`non nested at-rules with function and without space after name`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@import url("fineprint.css") print;`)), true)
	})

	it(`nested at-rules`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@media (min-width: 100px) {};`)), true)
	})

	it(`nested at-rules with newline after name`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@media\n(min-width: 100px) {};`)), true)
	})

	it(`nested at-rules with windows newline after name`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@media\r\n(min-width: 100px) {};`)), true)
	})

	it(`nested at-rules without space after name`, () => {
		equal(isStandardSyntaxAtRule(atRule(`@media(min-width: 100px) {};`)), true)
	})

	it(`ignore \`@content\` inside mixins space`, () => {
		let rules = scssAtRules(`@mixin mixin() { @content; };`)

		equal(rules.length, 2)
		deepEqual(rules.map((rule) => rule.name), [
			`mixin`,
			`content`,
		])
		equal(isStandardSyntaxAtRule(rules[0]), true)
		equal(isStandardSyntaxAtRule(rules[1]), false)
	})

	it(`ignore passing rulesets to mixins`, () => {
		let rules = lessAtRules(
			`@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`,
		)

		equal(rules.length, 2)
		equal(isStandardSyntaxAtRule(rules[0]), false)
		equal(isStandardSyntaxAtRule(rules[1]), false)
	})

	it(`ignore calling of mixins`, () => {
		let rules = lessAtRules(`a { .mixin(); }`)

		equal(rules.length, 1)
		equal(isStandardSyntaxAtRule(rules[0]), false)
	})

	it(`ignore variables`, () => {
		let rules = lessAtRules(`@my-variable: 10px; .top { margin-top: @my-variable; }`)

		equal(rules.length, 1)
		equal(isStandardSyntaxAtRule(rules[0]), false)
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
