import { equal } from "node:assert/strict"
import { it } from "node:test"

import hasInterpolation from "./hasInterpolation.js"

it(`hasInterpolation`, () => {
	equal(hasInterpolation(`(min-width#{$value}: 10px)`), true)
	equal(hasInterpolation(`(@{value}min-width : 10px)`), true)
	equal(hasInterpolation(`#{$Attr}-color`), true)
	equal(hasInterpolation(`@{Attr}-color`), true)
	equal(hasInterpolation(`#{50% - $n}`), true)
	equal(hasInterpolation(`.n-#{$n}`), true)
	equal(hasInterpolation(`:n-#{$n}`), true)
	equal(hasInterpolation(`.n-@{n}`), true)
	equal(hasInterpolation(`(min-width: 10px)`), false)
	equal(hasInterpolation(`.a{}`), false)
	equal(hasInterpolation(`$sass-variable + 'foo'`), false)
	equal(hasInterpolation(`10px`), false)
	equal(hasInterpolation(`@less-variable + 'foo'`), false)
})
