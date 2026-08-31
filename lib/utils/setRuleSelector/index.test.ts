import { type Document, parse, type Root, type Rule } from "postcss"
import { parse as parseLess } from "postcss-less"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"

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

	it(`writes the selector itself where the syntax keeps the comment in no raw`, () => {
		let node = lessRule(`a // c\n, b {}`)

		setRuleSelector(node, `a // c\r\n, b`)

		expect(node.selector).toBe(`a // c\r\n, b`)
		expect(node.toString()).toBe(`a // c\r\n, b {}`)
	})
})

/**
 * Reads the first rule of a stylesheet.
 * @param css - The stylesheet.
 * @returns That rule.
 */
function rule (css: string): Rule {
	return collect(parse(css))
}

/**
 * Reads the first rule of a stylesheet written in Less.
 * @param css - The stylesheet.
 * @returns That rule.
 */
function lessRule (css: string): Rule {
	return collect(parseLess(css))
}

/**
 * Takes the first rule out of a parsed stylesheet.
 * @param root - The parsed stylesheet.
 * @returns That rule.
 */
function collect (root: Root | Document): Rule {
	let list: Rule[] = []

	root.walkRules((node) => {
		list.push(node)
	})

	return pick(list)
}
