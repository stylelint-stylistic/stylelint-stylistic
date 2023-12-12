import { describe, it } from "node:test"
import { equal } from "node:assert/strict"

import { parse } from "postcss"
import selectorParser from "postcss-selector-parser"

import isStandardSyntaxCombinator from "../isStandardSyntaxCombinator.js"

describe(`isStandardSyntaxCombinator`, () => {
	it(`tag`, () => {
		equal(isStandardSyntaxCombinator(parse(`a {}`).first), false)
	})
	it(`descendant`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a b {}`)), true)
	})
	it(`descendant tab`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a\tb {}`)), true)
	})
	it(`descendant newline`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a\nb {}`)), true)
	})
	it(`descendant (double child)`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a >> b {}`)), true)
	})
	it(`child`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a > b {}`)), true)
	})
	it(`next sibling`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a + b {}`)), true)
	})
	it(`subsequent-sibling`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a ~ b {}`)), true)
	})
	it(`lowercase reference`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a /for/ b {}`)), false)
	})
	it(`mixedcase reference`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a /fOr/ b {}`)), false)
	})
	it(`uppercase reference`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a /FOR/ b {}`)), false)
	})
	it(`last node is combinator`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a ~, {}`)), false)
	})
	it(`first node is combinator`, () => {
		equal(isStandardSyntaxCombinator(combinator(`~ b {}`)), false)
	})
	it(`last node (in first container) is combinator`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a ~, b {}`)), false)
	})
	it(`first node (in second container) is combinator`, () => {
		equal(isStandardSyntaxCombinator(combinator(`a, ~ b {}`)), false)
	})
})

function combinator (css) {
	const list = []

	parse(css).walkRules((rule) => {
		selectorParser((selectorAST) => {
			selectorAST.walkCombinators((c) => list.push(c))
		}).processSync(rule.selector)
	})

	return list[0]
}
