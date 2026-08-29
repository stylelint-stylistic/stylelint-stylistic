import postcss from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import { beforeEach, describe, expect, it } from "vitest"

import { beforeBlockString } from "./index.js"

describe(`beforeBlockString`, () => {
	let css
	let res

	beforeEach(() => {
		css = ``
		res = ``
	})

	it(`runs on rules`, () => {
		expect(postcssCheck(`a {}`)).toBe(`a `)
		expect(postcssCheck(`\na\n{}`)).toBe(`\na\n`)
		css = `\n\na,\nb,\n\tspan > .foo\n{}`
		res = `\n\na,\nb,\n\tspan > .foo\n`
		expect(postcssCheck(css)).toBe(res)
	})

	it(`runs on at-rules`, () => {
		expect(postcssCheck(`@media print {}`)).toBe(`@media print `)

		css = `\n@media print, screen\n\t{}`
		res = `\n@media print, screen\n\t`
		expect(postcssCheck(css)).toBe(res)

		css = `@supports (animation-name: test) {}`
		res = `@supports (animation-name: test) `
		expect(postcssCheck(css)).toBe(res)

		css = `@document url(http://www.w3.org/),\n url-prefix(http://www.w3.org/Style/),\ndomain(mozilla.org),\nregexp("https:.*") {}`
		res = `@document url(http://www.w3.org/),\n url-prefix(http://www.w3.org/Style/),\ndomain(mozilla.org),\nregexp("https:.*") `
		expect(postcssCheck(css)).toBe(res)
	})

	it(`runs with noRawBefore`, () => {
		expect(postcssCheck({ noRawBefore: true }, `\na {}`)).toBe(`a `)

		css = `\n@media print {}`
		res = `@media print `
		expect(postcssCheck({ noRawBefore: true }, css)).toBe(res)
	})

	it(`runs with declaration directly at root`, () => {
		expect(postcssCheck(`foo: bar;`)).toBe(``)
	})

	it(`runs with comment after selector`, () => {
		expect(postcssCheck(`a /* x */\n{}`)).toBe(`a /* x */\n`)
	})

	it(`runs with an inline comment behind the selector, which this syntax files in the raw standing in front of the brace`, () => {
		expect(postcssCheck({}, `a // x\n{}`, scss)).toBe(`a // x\n`)
	})

	it(`runs with an inline comment inside the selector, which the syntax keeps a second copy of`, () => {
		expect(postcssCheck({}, `a, // x\nb {}`, scss)).toBe(`a, // x\nb `)
	})

	it(`runs with an inline comment in the params`, () => {
		expect(postcssCheck({}, `@media screen // x\n\t{}`, scss)).toBe(`@media screen // x\n\t`)
	})

	it(`runs on a Less mixin call with a block, whose leading dot the syntax keeps in a raw`, () => {
		expect(postcssCheck({}, `.m() {}`, less)).toBe(`.m() `)
	})

	it(`runs on a statement with no block`, () => {
		expect(postcssCheck(`@import "a";`)).toBe(``)
	})
})

function postcssCheck (options, cssString, syntax = postcss) {
	let opts = typeof options === `undefined` ? {} : options
	let css = typeof opts === `string` ? opts : cssString
	let root = syntax.parse(css, { from: undefined })

	return beforeBlockString(root.first, { opts: { syntax } }, opts)
}
