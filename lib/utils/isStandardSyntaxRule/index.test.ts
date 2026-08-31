import postcss, { type Parser, type Rule } from "postcss"
import { describe, expect, it } from "vitest"

import { isStandardSyntaxRule } from "./index.ts"

/**
 * Reads the first statement of a stylesheet, which the cases spell as a rule.
 * @param code - The stylesheet.
 * @param parser - The syntax to read it with.
 * @returns That rule.
 */
function node (code: string, parser: { parse: Parser } = postcss): Rule {
	return parser.parse(code).first as Rule
}

describe(`isStandardSyntaxRule`, () => {
	it(`type`, () => {
		expect(isStandardSyntaxRule(node(`a {}`))).toBe(true)
	})
	it(`when type selector before selector`, () => {
		expect(isStandardSyntaxRule(node(`when a {}`))).toBe(true)
	})
	it(`when type selector after selector`, () => {
		expect(isStandardSyntaxRule(node(`a when {}`))).toBe(true)
	})
	it(`pseudo-class`, () => {
		expect(isStandardSyntaxRule(node(`a:last-child {}`))).toBe(true)
	})
	it(`pseudo-class not`, () => {
		expect(isStandardSyntaxRule(node(`a:not(.a) {}`))).toBe(true)
	})
	it(`pseudo-element`, () => {
		expect(isStandardSyntaxRule(node(`a::after {}`))).toBe(true)
	})
	it(`custom-selector`, () => {
		expect(isStandardSyntaxRule(node(`:--custom-selector {}`))).toBe(true)
	})
	it(`compound custom-selectors`, () => {
		expect(isStandardSyntaxRule(node(`:--custom-selector:--custom-selector {}`))).toBe(true)
	})
	it(`custom-property-set`, () => {
		expect(isStandardSyntaxRule(node(`--custom-property-set: {}`))).toBe(false)
	})
	it(`scss nested properties`, () => {
		expect(isStandardSyntaxRule(node(`foo: {};`))).toBe(false)
	})
})
