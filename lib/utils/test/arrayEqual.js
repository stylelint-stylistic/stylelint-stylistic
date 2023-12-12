import { describe, it } from "node:test"
import { equal } from "node:assert/strict"

import arrayEqual from "../arrayEqual.js"

describe(`arrayEqual`, () => {
	it(`handles arrays`, () => {
		equal(arrayEqual([], []), true)
		equal(arrayEqual([1, 2], [1, 2]), true)
		equal(arrayEqual([1, 2], [3, 4]), false)
		equal(arrayEqual([1, 2], [1, 2, 3]), false)
		equal(arrayEqual([1, 2], []), false)

		const o1 = { a: 1, b: 2 }
		const o2 = { a: 1, b: 2 }
		const o1copy = o1

		equal(arrayEqual([o1], [o2]), false)
		equal(arrayEqual([o1], [o1copy]), true)
	})

	it(`returns false for non-arrays`, () => {
		equal(arrayEqual({ a: 1 }, [1]), false)
		equal(arrayEqual([1], /1/), false)
	})
})
