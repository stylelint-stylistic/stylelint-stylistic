import { equal } from "node:assert/strict"
import { beforeEach, describe, it } from "node:test"

import { parse } from "postcss"

import { nextNonCommentNode } from "./nextNonCommentNode.js"

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
			if (rule.selector === `a`) {
				aNode = rule
			}

			if (rule.selector === `b`) {
				bNode = rule
			}
		})

		equal(nextNonCommentNode(aNode.next()), bNode)
	})

	it(`next node does not exist`, () => {
		parse(caseA).walkRules((rule) => {
			if (rule.selector === `a`) {
				aNode = rule
			}

			if (rule.selector === `b`) {
				bNode = rule
			}
		})

		equal(nextNonCommentNode(bNode.next()), null)
	})

	it(`next node is a declaration preceded by a comment`, () => {
		let root = parse(caseB)

		root.walkRules((rule) => {
			aNode = rule
		})
		root.walkDecls((rule) => {
			colorNode = rule
		})

		equal(nextNonCommentNode(aNode.first), colorNode)
	})

	it(`next node is null preceded by a comment`, () => {
		parse(caseB).walkDecls((rule) => {
			colorNode = rule
		})

		equal(nextNonCommentNode(colorNode.next()), null)
	})
})
