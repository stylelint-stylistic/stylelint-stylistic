import { type Document, parse, type Root, type Rule } from "postcss"
import { parse as parseLess } from "postcss-less"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { getRuleSelector } from "./index.ts"

describe(`getRuleSelector`, () => {
	it(`has no comment in the selector`, () => {
		expect(getRuleSelector(rule(`a, b {}`))).toBe(`a, b`)
	})

	it(`has a comment inside the selector`, () => {
		expect(getRuleSelector(rule(`a /* c */,\nb {}`))).toBe(`a /* c */,\nb`)
	})

	it(`has an inline comment inside the selector, which the syntax spells in a copy of its own`, () => {
		expect(getRuleSelector(scssRule(`a // c\n, b {}`))).toBe(`a // c\n, b`)
	})

	it(`has an inline comment inside the selector, which the syntax keeps in no raw at all`, () => {
		expect(getRuleSelector(lessRule(`a // c\n, b {}`))).toBe(`a // c\n, b`)
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
 * Reads the first rule of a stylesheet written in SCSS.
 * @param css - The stylesheet.
 * @returns That rule.
 */
function scssRule (css: string): Rule {
	return collect(parseScss(css))
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

	let [first] = list

	if (!first) throw new Error(`The stylesheet holds no node of the kind asked for`)

	return first
}
