import { parse } from "postcss"
import { beforeEach, describe, expect, it } from "vitest"

import { nextNonCommentNode } from "./index.js"

/** The length of a run of comments the walk used to overflow the stack on. The threshold sits around eleven thousand on Node 26; this many throws every time. */
const COMMENT_RUN_LENGTH = 20_000

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

	it(`next node is the starting node itself, which is no comment`, () => {
		parse(caseB).walkDecls((rule) => {
			colorNode = rule
		})

		expect(nextNonCommentNode(colorNode)).toBe(colorNode)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/360
	it(`next node is a declaration preceded by a run of comments longer than the stack is deep`, () => {
		let root = parse(`a { ${`/* c */ `.repeat(COMMENT_RUN_LENGTH)}color: pink; }`)

		root.walkRules((rule) => {
			aNode = rule
		})
		root.walkDecls((rule) => {
			colorNode = rule
		})

		expect(nextNonCommentNode(aNode.first)).toBe(colorNode)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/360
	it(`next node is null preceded by a run of comments longer than the stack is deep`, () => {
		let root = parse(`a { ${`/* c */ `.repeat(COMMENT_RUN_LENGTH)}}`)

		root.walkRules((rule) => {
			aNode = rule
		})

		expect(nextNonCommentNode(aNode.first)).toBe(null)
	})
})
