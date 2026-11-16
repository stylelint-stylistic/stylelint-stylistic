import { parse } from "postcss"
import { describe, expect, it } from "vitest"

import { maskAddressTokens } from "./index.ts"

describe(`maskAddressTokens`, () => {
	it(`no address`, () => {
		expect(maskAddressTokens(`a { b: f(x(y)),c }`, `a { b: f(x(y)),c }`, parse(`a { b: f(x(y)),c }`))).toBe(`a { b: f(x(y)),c }`)
	})
})
