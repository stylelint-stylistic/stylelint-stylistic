import { describe, it, mock } from "node:test"
import { equal } from "node:assert/strict"

import { rule } from "postcss"

import transformSelector from "../transformSelector.js"

describe(`transformSelector`, () => {
	it(`success`, () => {
		const warn = mock.fn()
		const result = { warn }
		const ruleNode = rule({ selector: `a, b > c` })
		const callback = mock.fn()

		equal(transformSelector(result, ruleNode, callback), `a, b > c`)
		equal(warn.mock.calls.length, 0)
		equal(callback.mock.calls.length, 1)
	})

	it(`failure`, () => {
		const warn = mock.fn()
		const result = { warn }
		const ruleNode = rule({ selector: `a[}` })
		const callback = mock.fn()

		equal(transformSelector(result, ruleNode, callback), undefined)
		equal(warn.mock.calls.length, 1)
		equal(callback.mock.calls.length, 0)
	})
})
