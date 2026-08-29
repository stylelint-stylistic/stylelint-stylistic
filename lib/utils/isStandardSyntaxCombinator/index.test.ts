import { parse } from "postcss"
import selectorParser, { type Combinator } from "postcss-selector-parser"
import { describe, expect, it } from "vitest"

import { isStandardSyntaxCombinator } from "./index.ts"

describe(`isStandardSyntaxCombinator`, () => {
	it(`tag`, () => {
		// A node of the stylesheet rather than of a selector, which the util turns away by its type
		expect(isStandardSyntaxCombinator(parse(`a {}`).first as unknown as Combinator)).toBe(false)
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

/**
 * Reads the first combinator of the first rule of a stylesheet.
 * @param css - The stylesheet.
 * @returns That combinator.
 */
function combinator (css: string): Combinator {
	let list: Combinator[] = []

	parse(css).walkRules((rule) => {
		selectorParser((selectorAST) => {
			selectorAST.walkCombinators((c) => {
				list.push(c)
			})
		}).processSync(rule.selector)
	})

	return list[0]
}
