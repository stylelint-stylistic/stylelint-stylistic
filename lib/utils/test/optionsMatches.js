import { describe, it } from "node:test"
import { equal } from "node:assert/strict"

import optionsMatches from "../optionsMatches.js"

describe(`optionsMatches`, () => {
	it(`matches a string`, () => {
		equal(optionsMatches({ foo: `bar` }, `foo`, `bar`), true)

		equal(optionsMatches({ foo: `bar` }, `foo`, `BAR`), false)
		equal(optionsMatches(`not an object`, `foo`, `bar`), false)
		equal(optionsMatches({ baz: `bar` }, `foo`, `bar`), false)
		equal(optionsMatches({ foo: `100` }, `foo`, 100), false)
		equal(optionsMatches({ foo: `baz` }, `foo`, `bar`), false)

		equal(optionsMatches({ foo: [`baz`, `bar`] }, `foo`, `bar`), true)
		equal(optionsMatches({ foo: [`baz`, `qux`] }, `foo`, `bar`), false)
	})

	it(`matches a RegExp`, () => {
		equal(optionsMatches({ foo: `/\\.bar/` }, `foo`, `.bar`), true)
		equal(optionsMatches({ foo: `/\\.baz$/` }, `foo`, `.bar`), false)

		equal(optionsMatches({ foo: `/[a-z]+/` }, `foo`, `BAR`), false)
		equal(optionsMatches({ foo: `/[A-Z]+/` }, `foo`, `BAR`), true)

		equal(optionsMatches({ foo: `/[a-z]+/i` }, `foo`, `BAR`), true)
		equal(optionsMatches({ foo: `/[A-Z]+/i` }, `foo`, `bar`), true)

		equal(optionsMatches({ foo: [`/\\.bar$/`, `.baz`] }, `foo`, `.bar`), true)
		equal(optionsMatches({ foo: [`/\\.bar$/`, `.baz`] }, `foo`, `.baz`), true)
		equal(optionsMatches({ foo: [`/\\.bar$/`, `qux`] }, `foo`, `.baz`), false)
	})

	it(`does not match any value without the property`, () => {
		equal(optionsMatches({}, `foo`, `bar`), false)
	})

	it(`does not match any value with the empty array property`, () => {
		equal(optionsMatches({ foo: [] }, `foo`, `bar`), false)
	})
})
