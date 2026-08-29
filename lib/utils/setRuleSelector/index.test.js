import { parse } from "postcss"
import { parse as parseLess } from "postcss-less"
import { parse as parseScss, stringify as stringifyScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { setRuleSelector } from "./index.ts"

describe(`setRuleSelector`, () => {
	it(`has no comment in the selector`, () => {
		let node = rule(`a {}`)

		setRuleSelector(node, `b`)

		expect(node.selector).toBe(`b`)
		expect(node.toString()).toBe(`b {}`)
	})

	it(`has a comment inside the selector`, () => {
		let node = rule(`a /* c */,\nb {}`)

		setRuleSelector(node, `a /* c */,\r\nb`)

		expect(node.toString()).toBe(`a /* c */,\r\nb {}`)
	})

	it(`keeps the cleaned selector untouched when a comment was dropped from it`, () => {
		let node = rule(`a /* c */,\nb {}`)

		setRuleSelector(node, `a /* c */,\r\nb`)

		expect(node.selector).toBe(`a ,\nb`)
	})

	it(`returns the rule it was given`, () => {
		let node = rule(`a {}`)

		expect(setRuleSelector(node, `b`)).toBe(node)
	})

	it(`writes the copy the syntax prints`, () => {
		let node = scssRule(`a // c\n, b {}`)

		setRuleSelector(node, `a // c\r\n, b`)

		expect(/** @type {import('../typeGuards/index.ts').SyntaxRaw} */ (node.raws.selector).scss).toBe(`a // c\r\n, b`)
	})

	it(`keeps the raw beside it in step`, () => {
		let node = scssRule(`a // c\n, b {}`)

		setRuleSelector(node, `a // c\r\n, b`)

		expect(/** @type {import('../typeGuards/index.ts').SyntaxRaw} */ (node.raws.selector).raw).toBe(`a /* c*/\r\n, b`)
	})

	it(`the syntax prints what was written`, () => {
		let root = parseScss(`a // c\n, b {}`)

		root.walkRules((node) => {
			setRuleSelector(node, `a // c\r\n, b`)
		})

		expect(root.toString(stringifyScss)).toBe(`a // c\r\n, b {}`)
	})

	it(`writes the selector itself where the syntax keeps the comment in no raw`, () => {
		let node = lessRule(`a // c\n, b {}`)

		setRuleSelector(node, `a // c\r\n, b`)

		expect(node.selector).toBe(`a // c\r\n, b`)
		expect(node.toString()).toBe(`a // c\r\n, b {}`)
	})
})

/**
 * Reads the first rule of a stylesheet.
 * @param {string} css - The stylesheet.
 * @returns {import('postcss').Rule} That rule.
 */
function rule (css) {
	return collect(parse(css))
}

/**
 * Reads the first rule of a stylesheet written in SCSS.
 * @param {string} css - The stylesheet.
 * @returns {import('postcss').Rule} That rule.
 */
function scssRule (css) {
	return collect(parseScss(css))
}

/**
 * Reads the first rule of a stylesheet written in Less.
 * @param {string} css - The stylesheet.
 * @returns {import('postcss').Rule} That rule.
 */
function lessRule (css) {
	return collect(parseLess(css))
}

/**
 * Takes the first rule out of a parsed stylesheet.
 * @param {import('postcss').Root | import('postcss').Document} root - The parsed stylesheet.
 * @returns {import('postcss').Rule} That rule.
 */
function collect (root) {
	/** @type {import('postcss').Rule[]} */
	let list = []

	root.walkRules((node) => {
		list.push(node)
	})

	return list[0]
}
