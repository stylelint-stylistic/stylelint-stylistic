import { ok } from "node:assert/strict"
import { test } from "node:test"

import { isCustomMediaQuery } from "./index.js"

test(`isCustomMediaQuery`, () => {
	ok(isCustomMediaQuery(`--custom-media-query`))
	ok(!isCustomMediaQuery(`border-top-left-radius`))
	ok(!isCustomMediaQuery(`-webkit-appearance`))
	ok(!isCustomMediaQuery(`$sass-variable`))
	ok(!isCustomMediaQuery(`@less-variable`))
	ok(!isCustomMediaQuery(`var(--something)`))
	ok(!isCustomMediaQuery(`var(  --something  )`))
})
