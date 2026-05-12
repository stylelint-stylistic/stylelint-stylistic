import { expect, it } from "vitest"

import { isCustomProperty } from "./index.js"

it(`isCustomProperty`, () => {
	expect(isCustomProperty(`--custom-property`)).toBe(true)
	expect(isCustomProperty(`border-top-left-radius`)).toBe(false)
	expect(isCustomProperty(`-webkit-appearance`)).toBe(false)
	expect(isCustomProperty(`$sass-variable`)).toBe(false)
	expect(isCustomProperty(`@less-variable`)).toBe(false)
	expect(isCustomProperty(`var(--something)`)).toBe(false)
	expect(isCustomProperty(`var(  --something  )`)).toBe(false)
})
