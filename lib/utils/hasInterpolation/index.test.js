import { expect, it } from "vitest"

import { hasInterpolation } from "./index.js"

it(`hasInterpolation`, () => {
	expect(hasInterpolation(`(min-width#{$value}: 10px)`)).toBe(true)
	expect(hasInterpolation(`(@{value}min-width : 10px)`)).toBe(true)
	expect(hasInterpolation(`#{$Attr}-color`)).toBe(true)
	expect(hasInterpolation(`@{Attr}-color`)).toBe(true)
	expect(hasInterpolation(`#{50% - $n}`)).toBe(true)
	expect(hasInterpolation(`.n-#{$n}`)).toBe(true)
	expect(hasInterpolation(`:n-#{$n}`)).toBe(true)
	expect(hasInterpolation(`.n-@{n}`)).toBe(true)
	expect(hasInterpolation(`(min-width: 10px)`)).toBe(false)
	expect(hasInterpolation(`.a{}`)).toBe(false)
	expect(hasInterpolation(`$sass-variable + 'foo'`)).toBe(false)
	expect(hasInterpolation(`10px`)).toBe(false)
	expect(hasInterpolation(`@less-variable + 'foo'`)).toBe(false)
})
