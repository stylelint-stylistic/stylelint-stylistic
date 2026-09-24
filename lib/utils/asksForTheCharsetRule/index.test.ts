import postcss, { type Parser, type Root } from "postcss"
import postcssHtml from "postcss-html"
import { parse as parseScss } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"

import { asksForTheCharsetRule } from "./index.ts"

/** The syntax as its declaration should spell it: the parser is always there, whatever the optional field says. */
let html = postcssHtml as { parse: Parser }

/** A namespace's syntax, whose compiler stands between the file and its output. */
let namespaced: Syntax = { ...css, namespace: `scss` }

/**
 * Asks about a stylesheet under a configuration listing the given rules.
 * @param code - The stylesheet.
 * @param rules - The `rules` of the configuration.
 * @param parser - The parser, plain CSS by default.
 * @param syntax - The syntax the asking rule is built over, the core's by default.
 * @returns The answer for the result's own root.
 */
function asks (code: string, rules: Record<string, unknown> = {}, parser: { parse: Parser } = postcss, syntax = css): boolean {
	let root = parser.parse(code) as Root
	let result = { root, stylelint: { config: { rules } } } as unknown as PostcssResult

	return asksForTheCharsetRule(root, result, syntax)
}

describe(`asksForTheCharsetRule`, () => {
	it(`a charset with the rule off`, () => {
		expect(asks(`@charset "utf-8";\na {}`)).toBe(true)
	})

	it(`a charset in upper case, single-quoted and nested, each dead and each passed over`, () => {
		expect(asks(`@CHARSET "utf-8";`)).toBe(true)
		expect(asks(`@charset 'utf-8';`)).toBe(true)
		expect(asks(`a { @charset "utf-8"; }`)).toBe(true)
	})

	it(`a charset with the rule on, spelled as Stylelint normalizes it and as a configuration writes it`, () => {
		expect(asks(`@charset "utf-8";`, { "at-charset-rule-no-invalid": [true] })).toBe(false)
		expect(asks(`@charset "utf-8";`, { "at-charset-rule-no-invalid": true })).toBe(false)
	})

	it(`a charset with the rule listed but off`, () => {
		expect(asks(`@charset "utf-8";`, { "at-charset-rule-no-invalid": null })).toBe(true)
		expect(asks(`@charset "utf-8";`, { "at-charset-rule-no-invalid": [null] })).toBe(true)
		expect(asks(`@charset "utf-8";`, { "at-charset-rule-no-invalid": false })).toBe(true)
		expect(asks(`@charset "utf-8";`, { "at-charset-rule-no-invalid": [false] })).toBe(true)
	})

	it(`no charset`, () => {
		expect(asks(`@import "x.css";\na {}`)).toBe(false)
	})

	it(`a charset inside a comment or a string, which is no at-rule`, () => {
		expect(asks(`/* @charset "utf-8"; */\na { content: "@charset 'x';"; }`)).toBe(false)
	})

	it(`a charset in a block of a page, whose root is not the result's`, () => {
		let document = html.parse(`<style>@charset "utf-8";\na {}</style>`) as Root
		let block = document.first as unknown as Root
		let result = { root: document, stylelint: { config: { rules: {} } } } as unknown as PostcssResult

		expect(asksForTheCharsetRule(block, result, css)).toBe(false)
	})

	it(`a charset under a namespace, whose compiler stands between the file and its output`, () => {
		expect(asks(`@charset "utf-8";\na {}`, {}, { parse: parseScss }, namespaced)).toBe(false)
	})
})
