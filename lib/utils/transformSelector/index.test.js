import { rule } from "postcss"
import { describe, expect, it, vi } from "vitest"

import { transformSelector } from "./index.js"

describe(`transformSelector`, () => {
	it(`success`, () => {
		let warn = vi.fn()
		let result = { warn }
		let ruleNode = rule({ selector: `a, b > c` })
		let callback = vi.fn()

		expect(transformSelector(result, ruleNode, callback)).toBe(`a, b > c`)
		expect(warn.mock.calls.length).toBe(0)
		expect(callback.mock.calls.length).toBe(1)
	})

	it(`failure`, () => {
		let warn = vi.fn()
		let result = { warn }
		let ruleNode = rule({ selector: `a[}` })
		let callback = vi.fn()

		expect(transformSelector(result, ruleNode, callback)).toBe(undefined)
		expect(warn.mock.calls.length).toBe(1)
		expect(callback.mock.calls.length).toBe(0)
	})
})
