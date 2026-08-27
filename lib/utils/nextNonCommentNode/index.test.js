import { parse } from "postcss"
import { beforeEach, describe, expect, it } from "vitest"

import { nextNonCommentNode } from "./index.js"

describe(`nextNonCommentNode`, () => {
	let caseA
	let caseB
	let aNode
	let bNode
	let colorNode

	beforeEach(() => {
		aNode = undefined
		bNode = undefined
		colorNode = undefined
		caseA = `a {} /* x */ b {}`
		caseB = `a { /* x */ color: pink; /* y */ }`
	})

	it(`next node is a selector preceded by a comment`, () => {
		parse(caseA).walkRules((rule) => {
			if (rule.selector === `a`) aNode = rule

			if (rule.selector === `b`) bNode = rule
		})

		expect(nextNonCommentNode(aNode.next())).toBe(bNode)
	})

	it(`next node does not exist`, () => {
		parse(caseA).walkRules((rule) => {
			if (rule.selector === `a`) aNode = rule

			if (rule.selector === `b`) bNode = rule
		})

		expect(nextNonCommentNode(bNode.next())).toBe(null)
	})

	it(`next node is a declaration preceded by a comment`, () => {
		let root = parse(caseB)

		root.walkRules((rule) => {
			aNode = rule
		})
		root.walkDecls((rule) => {
			colorNode = rule
		})

		expect(nextNonCommentNode(aNode.first)).toBe(colorNode)
	})

	it(`next node is null preceded by a comment`, () => {
		parse(caseB).walkDecls((rule) => {
			colorNode = rule
		})

		expect(nextNonCommentNode(colorNode.next())).toBe(null)
	})

	it(`does not overflow the stack on a long run of comments`, () => {
		// A recursive walk overflowed at ~11k comments; the iterative walk
		// handles far more without throwing. Regression test for #360.
		let root = parse(`a { color: pink; ${`/* c */ `.repeat(20000)} top: 0; }`)
		let firstDecl

		root.walkDecls((decl) => {
			if (!firstDecl) firstDecl = decl
		})

		let result
		expect(() => {
			result = nextNonCommentNode(firstDecl.next())
		}).not.toThrow()
		expect(result.type).toBe(`decl`)
		expect(result.prop).toBe(`top`)
	})
})
