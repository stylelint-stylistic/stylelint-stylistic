import { describe, expect, it } from "vitest"

import { optionsMatches } from "./index.js"

describe(`optionsMatches`, () => {
	it(`matches a string`, () => {
		expect(optionsMatches({ foo: `bar` }, `foo`, `bar`)).toBe(true)

		expect(optionsMatches({ foo: `bar` }, `foo`, `BAR`)).toBe(false)
		expect(optionsMatches(`not an object`, `foo`, `bar`)).toBe(false)
		expect(optionsMatches({ baz: `bar` }, `foo`, `bar`)).toBe(false)
		expect(optionsMatches({ foo: `100` }, `foo`, 100)).toBe(false)
		expect(optionsMatches({ foo: `baz` }, `foo`, `bar`)).toBe(false)

		expect(optionsMatches({ foo: [`baz`, `bar`] }, `foo`, `bar`)).toBe(true)
		expect(optionsMatches({ foo: [`baz`, `qux`] }, `foo`, `bar`)).toBe(false)
	})

	it(`matches a RegExp`, () => {
		expect(optionsMatches({ foo: `/\\.bar/` }, `foo`, `.bar`)).toBe(true)
		expect(optionsMatches({ foo: `/\\.baz$/` }, `foo`, `.bar`)).toBe(false)

		expect(optionsMatches({ foo: `/[a-z]+/` }, `foo`, `BAR`)).toBe(false)
		expect(optionsMatches({ foo: `/[A-Z]+/` }, `foo`, `BAR`)).toBe(true)

		expect(optionsMatches({ foo: `/[a-z]+/i` }, `foo`, `BAR`)).toBe(true)
		expect(optionsMatches({ foo: `/[A-Z]+/i` }, `foo`, `bar`)).toBe(true)

		expect(optionsMatches({ foo: [`/\\.bar$/`, `.baz`] }, `foo`, `.bar`)).toBe(true)
		expect(optionsMatches({ foo: [`/\\.bar$/`, `.baz`] }, `foo`, `.baz`)).toBe(true)
		expect(optionsMatches({ foo: [`/\\.bar$/`, `qux`] }, `foo`, `.baz`)).toBe(false)
	})

	it(`does not match any value without the property`, () => {
		expect(optionsMatches({}, `foo`, `bar`)).toBe(false)
	})

	it(`does not match any value with the empty array property`, () => {
		expect(optionsMatches({ foo: [] }, `foo`, `bar`)).toBe(false)
	})
})
