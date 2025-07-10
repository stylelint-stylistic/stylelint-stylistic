import { equal } from "node:assert/strict"
import { describe, it, mock } from "node:test"

import { rule } from "postcss"

import { transformSelector } from "./transformSelector.js"

describe(`transformSelector`, () => {
	it(`success`, () => {
		let warn = mock.fn()
		let result = { warn }
		let ruleNode = rule({ selector: `a, b > c` })
		let callback = mock.fn()

		equal(transformSelector(result, ruleNode, callback), `a, b > c`)
		equal(warn.mock.calls.length, 0)
		equal(callback.mock.calls.length, 1)
	})

	it(`failure`, () => {
		let warn = mock.fn()
		let result = { warn }
		let ruleNode = rule({ selector: `a[}` })
		let callback = mock.fn()

		equal(transformSelector(result, ruleNode, callback), undefined)
		equal(warn.mock.calls.length, 1)
		equal(callback.mock.calls.length, 0)
	})
})
