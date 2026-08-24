import { parse } from "postcss"
import { parse as parseLess } from "postcss-less"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { getRuleSelector } from "./index.js"

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

function rule (css) {
	return collect(parse(css))
}

function scssRule (css) {
	return collect(parseScss(css))
}

function lessRule (css) {
	return collect(parseLess(css))
}

function collect (root) {
	let list = []

	root.walkRules((node) => list.push(node))

	return list[0]
}
