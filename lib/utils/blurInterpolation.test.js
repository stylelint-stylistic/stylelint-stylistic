import { equal } from "node:assert/strict"
import { beforeEach, describe, it } from "node:test"

import blurInterpolation from "./blurInterpolation.js"

describe(`blurInterpolation`, () => {
	let css
	let res

	beforeEach(() => {
		css = ``
		res = ``
	})

	it(`blurInterpolation`, () => {
		equal(blurInterpolation(`#{$selector}`), ` $selector `)
		equal(blurInterpolation(`#{$selector}`, `\``), `\`$selector\``)
		equal(blurInterpolation(`#{$selector * 10px}`), ` $selector * 10px `)

		css = `#{$font-size}/#{$line-height}`
		res = ` $font-size / $line-height `
		equal(blurInterpolation(css), res)

		css = `url(#{$selector * 10px})`
		res = `url( $selector * 10px )`
		equal(blurInterpolation(css), res)

		css = `calc(#{$selector} * 2)`
		res = `calc( $selector  * 2)`
		equal(blurInterpolation(css), res)

		css = `filter: progid:DXImageTransform.Microsoft.gradient(enabled='false', startColorstr='#{ie-hex-str($green)}', endColorstr='#{ie-hex-str($translucent-red)}');`
		res = `filter: progid:DXImageTransform.Microsoft.gradient(enabled='false', startColorstr=' ie-hex-str($green) ', endColorstr=' ie-hex-str($translucent-red) ');`
		equal(blurInterpolation(css), res)

		css = `"I ate #{5 + 10} pies!"`
		res = `"I ate  5 + 10  pies!"`
		equal(blurInterpolation(css), res)
		equal(blurInterpolation(`@{variable}`), ` variable `)
	})
})
