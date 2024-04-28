import { equal } from "node:assert/strict"
import { beforeEach, describe, it } from "node:test"

import postcss from "postcss"

import beforeBlockString from "./beforeBlockString.js"

describe(`beforeBlockString`, () => {
	let css
	let res

	beforeEach(() => {
		css = ``
		res = ``
	})

	it(`runs on rules`, () => {
		equal(postcssCheck(`a {}`), `a `)
		equal(postcssCheck(`\na\n{}`), `\na\n`)
		css = `\n\na,\nb,\n\tspan > .foo\n{}`
		res = `\n\na,\nb,\n\tspan > .foo\n`
		equal(postcssCheck(css), res)
	})

	it(`runs on at-rules`, () => {
		equal(postcssCheck(`@media print {}`), `@media print `)

		css = `\n@media print, screen\n\t{}`
		res = `\n@media print, screen\n\t`
		equal(postcssCheck(css), res)

		css = `@supports (animation-name: test) {}`
		res = `@supports (animation-name: test) `
		equal(postcssCheck(css), res)

		css = `@document url(http://www.w3.org/),\n url-prefix(http://www.w3.org/Style/),\ndomain(mozilla.org),\nregexp("https:.*") {}`
		res = `@document url(http://www.w3.org/),\n url-prefix(http://www.w3.org/Style/),\ndomain(mozilla.org),\nregexp("https:.*") `
		equal(postcssCheck(css), res)
	})

	it(`runs with noRawBefore`, () => {
		equal(postcssCheck({ noRawBefore: true }, `\na {}`), `a `)

		css = `\n@media print {}`
		res = `@media print `
		equal(postcssCheck({ noRawBefore: true }, css), res)
	})

	it(`runs with declaration directly at root`, () => {
		equal(postcssCheck(`foo: bar;`), ``)
	})

	it(`runs with comment after selector`, () => {
		equal(postcssCheck(`a /* x */\n{}`), `a /* x */\n`)
	})
})

function postcssCheck (options, cssString, parser) {
	if (typeof options === `undefined`) {
		options = {}
	}

	if (typeof parser === `undefined`) {
		parser = postcss
	}

	if (typeof options === `string`) {
		cssString = options
	}

	const root = parser.parse(cssString)

	return beforeBlockString(root.first, options)
}
