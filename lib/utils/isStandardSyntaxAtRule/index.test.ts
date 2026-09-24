import { type AtRule, parse } from "postcss"
import { describe, expect, it } from "vitest"

import { isStandardSyntaxAtRule } from "./index.ts"

/**
 * Reads the first at-rule of a stylesheet, nested or not.
 * @param code - The stylesheet.
 * @returns That at-rule.
 */
function atRule (code: string): AtRule {
	let found: AtRule | undefined

	parse(code).walkAtRules((node) => {
		found ??= node
	})

	if (!found) throw new Error(`No at-rule in ${JSON.stringify(code)}`)

	return found
}

describe(`isStandardSyntaxAtRule`, () => {
	it(`an import`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@import "x.css";`))).toBe(true)
	})

	it(`a media query carrying a block`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@media (min-width: 100px) {}`))).toBe(true)
	})

	it(`a charset in lower case`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@charset "utf-8";`))).toBe(false)
	})

	it(`a charset in upper case`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@CHARSET "utf-8";`))).toBe(false)
	})

	it(`a charset in mixed case`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@Charset "utf-8";`))).toBe(false)
	})

	it(`a charset spelled with single quotes, which declares nothing and is passed over all the same`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@charset 'utf-8';`))).toBe(false)
	})

	it(`a charset nested in a rule`, () => {
		expect(isStandardSyntaxAtRule(atRule(`a { @charset "utf-8"; }`))).toBe(false)
	})

	it(`an at-rule whose name merely opens with the word`, () => {
		expect(isStandardSyntaxAtRule(atRule(`@charsets "utf-8";`))).toBe(true)
	})
})
