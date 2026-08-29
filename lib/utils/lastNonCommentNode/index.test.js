import { parse } from "postcss"
import { describe, expect, it } from "vitest"

import { lastNonCommentNode } from "./index.ts"

/**
 * Parses a stylesheet and hands back the block of its first rule.
 * @param {string} css - The stylesheet.
 * @returns {import('postcss').Rule} That rule.
 */
function firstBlock (css) {
	return /** @type {import('postcss').Rule} */ (parse(css).first)
}

describe(`lastNonCommentNode`, () => {
	it(`a block ending on a declaration`, () => {
		let block = firstBlock(`a { color: pink }`)

		expect(lastNonCommentNode(block)).toBe(block.nodes[0])
	})

	it(`a comment closing the block behind the declaration`, () => {
		let block = firstBlock(`a { color: pink /* c */ }`)

		expect(lastNonCommentNode(block)).toBe(block.nodes[0])
	})

	it(`two comments closing the block behind the declaration`, () => {
		let block = firstBlock(`a { color: pink /* c */\n/* d */ }`)

		expect(lastNonCommentNode(block)).toBe(block.nodes[0])
	})

	it(`a comment standing in front of the declaration, which is looked past from the end alone`, () => {
		let block = firstBlock(`a { /* c */ color: pink }`)

		expect(lastNonCommentNode(block)).toBe(block.nodes[1])
	})

	it(`a nested rule closing the block, which is not passed over`, () => {
		let block = firstBlock(`a { color: pink; b {} }`)

		expect(lastNonCommentNode(block)).toBe(block.nodes[1])
	})

	it(`a comment as the only node of the block`, () => {
		expect(lastNonCommentNode(firstBlock(`a { /* c */ }`))).toBe(null)
	})

	it(`an empty block`, () => {
		expect(lastNonCommentNode(firstBlock(`a {}`))).toBe(null)
	})

	it(`no container at all, which is what a node standing on no parent hands over`, () => {
		expect(lastNonCommentNode(/** @type {import('postcss').Container | undefined} */ (parse(`a {}`).parent))).toBe(null)
	})
})
