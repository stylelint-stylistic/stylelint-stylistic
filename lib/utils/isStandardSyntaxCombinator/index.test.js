import { parse } from "postcss"
import selectorParser from "postcss-selector-parser"
import { describe, expect, it } from "vitest"

import { isStandardSyntaxCombinator } from "./index.js"

describe(`isStandardSyntaxCombinator`, () => {
	it(`tag`, () => {
		expect(isStandardSyntaxCombinator(parse(`a {}`).first)).toBe(false)
	})
	it(`descendant`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a b {}`))).toBe(true)
	})
	it(`descendant tab`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a\tb {}`))).toBe(true)
	})
	it(`descendant newline`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a\nb {}`))).toBe(true)
	})
	it(`descendant (double child)`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a >> b {}`))).toBe(true)
	})
	it(`child`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a > b {}`))).toBe(true)
	})
	it(`next sibling`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a + b {}`))).toBe(true)
	})
	it(`subsequent-sibling`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a ~ b {}`))).toBe(true)
	})
	it(`lowercase reference`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a /for/ b {}`))).toBe(false)
	})
	it(`mixedcase reference`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a /fOr/ b {}`))).toBe(false)
	})
	it(`uppercase reference`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a /FOR/ b {}`))).toBe(false)
	})
	it(`last node is combinator`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a ~, {}`))).toBe(false)
	})
	it(`first node is combinator`, () => {
		expect(isStandardSyntaxCombinator(combinator(`~ b {}`))).toBe(false)
	})
	it(`last node (in first container) is combinator`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a ~, b {}`))).toBe(false)
	})
	it(`first node (in second container) is combinator`, () => {
		expect(isStandardSyntaxCombinator(combinator(`a, ~ b {}`))).toBe(false)
	})
})

function combinator (css) {
	let list = []

	parse(css).walkRules((rule) => {
		selectorParser((selectorAST) => {
			selectorAST.walkCombinators((c) => list.push(c))
		}).processSync(rule.selector)
	})

	return list[0]
}
