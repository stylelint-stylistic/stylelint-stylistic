import { it } from "node:test"
import { equal } from "node:assert/strict"

import isCustomProperty from "../isCustomProperty.js"

it(`isCustomProperty`, () => {
	equal(isCustomProperty(`--custom-property`), true)
	equal(isCustomProperty(`border-top-left-radius`), false)
	equal(isCustomProperty(`-webkit-appearance`), false)
	equal(isCustomProperty(`$sass-variable`), false)
	equal(isCustomProperty(`@less-variable`), false)
	equal(isCustomProperty(`var(--something)`), false)
	equal(isCustomProperty(`var(  --something  )`), false)
})
