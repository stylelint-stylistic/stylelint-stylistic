import { expect, test } from "vitest"

import { isCustomMediaQuery } from "./index.js"

test(`isCustomMediaQuery`, () => {
	expect(isCustomMediaQuery(`--custom-media-query`)).toBeTruthy()
	expect(isCustomMediaQuery(`border-top-left-radius`)).toBeFalsy()
	expect(isCustomMediaQuery(`-webkit-appearance`)).toBeFalsy()
	expect(isCustomMediaQuery(`$sass-variable`)).toBeFalsy()
	expect(isCustomMediaQuery(`@less-variable`)).toBeFalsy()
	expect(isCustomMediaQuery(`var(--something)`)).toBeFalsy()
	expect(isCustomMediaQuery(`var(  --something  )`)).toBeFalsy()
})
