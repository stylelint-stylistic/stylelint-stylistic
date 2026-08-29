import postcss from "postcss"
import postcssLess from "postcss-less"
import { describe, expect, it } from "vitest"

import { isStandardSyntaxRule } from "./index.ts"

/**
 * Reads the first statement of a stylesheet, which the cases spell as a rule.
 * @param code - The stylesheet.
 * @param parser - The syntax to read it with.
 * @returns That rule.
 */
function node (code: string, parser: { parse: import("postcss").Parser } = postcss): import("postcss").Rule {
	return parser.parse(code).first as import("postcss").Rule
}

/**
 * Reads the first statement of a stylesheet written in Less, which the cases spell as a rule.
 * @param code - The stylesheet.
 * @returns That rule.
 */
function lessNode (code: string): import("postcss").Rule {
	return node(code, postcssLess)
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
	it(`less class parametric mixin`, () => {
		expect(isStandardSyntaxRule(lessNode(`.mixin-name(@var) {}`))).toBe(false)
	})
	it(`non-outputting parametric Less class mixin definition`, () => {
		expect(isStandardSyntaxRule(lessNode(`.mixin-name() {}`))).toBe(false)
	})
	it(`non-outputting Less class mixin definition`, () => {
		expect(isStandardSyntaxRule(lessNode(`.mixin-name(@a, @b) {}`))).toBe(false)
	})
	it(`non-outputting parametric Less class mixin definition ending in number`, () => {
		expect(isStandardSyntaxRule(lessNode(`.mixin-name3(@a, @b) {}`))).toBe(false)
	})
	it(`non-outputting Less ID mixin definition`, () => {
		expect(isStandardSyntaxRule(lessNode(`#mixin-name() {}`))).toBe(false)
	})
	it(`less mixin`, () => {
		expect(isStandardSyntaxRule(lessNode(`.box-shadow(@style, @c) when (iscolor(@c)) {}`))).toBe(false)
	})
	it(`less extend`, () => {
		expect(isStandardSyntaxRule(lessNode(`&:extend(.inline) {}`))).toBe(false)
		expect(isStandardSyntaxRule(lessNode(`.a:extend(.b all) {}`))).toBe(false)
	})
	it(`a quoted attribute value spelling a less extend, which \`postcss-less\` marks as one`, () => {
		expect(isStandardSyntaxRule(lessNode(`[title=":extend(x)"] {}`))).toBe(true)
		expect(isStandardSyntaxRule(lessNode(`[data-x="a:extend(y)"] {}`))).toBe(true)
		expect(isStandardSyntaxRule(lessNode(`[title=':extend(x)'] {}`))).toBe(true)
		expect(isStandardSyntaxRule(lessNode(`[title=":extend(x)"]:extend(.b) {}`))).toBe(false)
	})
	it(`a less extend written in another case, which the syntax marks the rule for all the same`, () => {
		expect(isStandardSyntaxRule(lessNode(`.a:EXTEND(.b) {}`))).toBe(false)
		expect(isStandardSyntaxRule(lessNode(`.a:Extend(.b) {}`))).toBe(false)
		expect(isStandardSyntaxRule(lessNode(`[title=":EXTEND(x)"] {}`))).toBe(true)
		expect(isStandardSyntaxRule(node(`.a:EXTEND(.b) {}`))).toBe(true)
	})
	it(`less detached rulesets`, () => {
		expect(isStandardSyntaxRule(lessNode(`@foo: {};`))).toBe(false)
	})
	it(`less guarded namespaces`, () => {
		expect(isStandardSyntaxRule(lessNode(`#namespace when (@mode=huge) {}`))).toBe(false)
	})
	it(`less parametric mixins`, () => {
		expect(isStandardSyntaxRule(lessNode(`.mixin (@variable: 5) {}`))).toBe(false)
	})
	it(`mixin guards`, () => {
		expect(isStandardSyntaxRule(lessNode(`.mixin (@variable) when (@variable = 10px) {}`))).toBe(false)
	})
	it(`css guards`, () => {
		expect(isStandardSyntaxRule(lessNode(`.foo() when (@variable = true) {}`))).toBe(false)
	})
	it(`css guards without spaces`, () => {
		expect(isStandardSyntaxRule(lessNode(`.foo()when(@variable = true) {}`))).toBe(false)
	})
	it(`css guards with multiple spaces`, () => {
		expect(isStandardSyntaxRule(lessNode(`.foo()   when   (@variable = true) {}`))).toBe(false)
	})
	it(`css guards with newlines`, () => {
		expect(isStandardSyntaxRule(lessNode(`.foo()\nwhen\n(@variable = true) {}`))).toBe(false)
	})
	it(`css guards with CRLF`, () => {
		expect(isStandardSyntaxRule(lessNode(`.foo()\r\nwhen\r\n(@variable = true) {}`))).toBe(false)
	})
	it(`css guards with parenthesis`, () => {
		expect(isStandardSyntaxRule(lessNode(`.foo() when (default()) {}`))).toBe(false)
	})
	it(`css guards with not`, () => {
		expect(isStandardSyntaxRule(lessNode(`.foo() when not (@variable = true) {}`))).toBe(false)
	})
})
