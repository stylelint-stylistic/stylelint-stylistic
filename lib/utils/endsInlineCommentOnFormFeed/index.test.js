import { parse } from "postcss"
import less from "postcss-less"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { endsInlineCommentOnFormFeed } from "./index.js"

describe(`endsInlineCommentOnFormFeed`, () => {
	it(`a value this syntax keeps a copy of its own of`, () => {
		expect(endsInlineCommentOnFormFeed(scssDecl(`a { margin: 0 // c\n  1px }`))).toBe(true)
	})

	it(`a set of parameters this syntax keeps a copy of its own of`, () => {
		expect(endsInlineCommentOnFormFeed(scssAtRule(`@media screen // c\n  and (min-width: 1px) {}`))).toBe(true)
	})

	it(`a value of the same syntax carrying no inline comment`, () => {
		expect(endsInlineCommentOnFormFeed(scssDecl(`a { margin: 0 /* c */ 1px }`))).toBe(false)
	})

	it(`a value of a syntax that keeps its comments where they stand`, () => {
		expect(endsInlineCommentOnFormFeed(lessDecl(`a { margin: 0 // c\n  1px }`))).toBe(false)
	})

	it(`a value of plain CSS`, () => {
		expect(endsInlineCommentOnFormFeed(decl(`a { margin: 0 1px }`))).toBe(false)
	})
})

function decl (css) {
	let list = []

	parse(css).walkDecls((d) => list.push(d))

	return list[0]
}

function scssDecl (css) {
	let list = []

	parseScss(css).walkDecls((d) => list.push(d))

	return list[0]
}

function lessDecl (css) {
	let list = []

	less.parse(css).walkDecls((d) => list.push(d))

	return list[0]
}

function scssAtRule (css) {
	let list = []

	parseScss(css).walkAtRules((rule) => list.push(rule))

	return list[0]
}
