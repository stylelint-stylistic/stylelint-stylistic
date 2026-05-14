import { describe, expect, it } from "vitest"

import { matchesStringOrRegExp } from "./index.js"

describe(`matchesStringOrRegExp`, () => {
	it(`comparing with string comparisonValues`, () => {
		expect(matchesStringOrRegExp(`bar`, `bar`)).toStrictEqual({
			match: `bar`,
			pattern: `bar`,
			substring: `bar`,
		})
		expect(matchesStringOrRegExp(`bar`, `/bar something`)).toBe(false)
		expect(matchesStringOrRegExp(`/bar something`, `/bar something`)).toStrictEqual({
			match: `/bar something`,
			pattern: `/bar something`,
			substring: `/bar something`,
		})
		expect(matchesStringOrRegExp(`bar something/`, `bar something/`)).toStrictEqual({
			match: `bar something/`,
			pattern: `bar something/`,
			substring: `bar something/`,
		})
		expect(matchesStringOrRegExp(`bar something/`, `bar something//`)).toBe(false)

		expect(matchesStringOrRegExp([`foo`, `bar`], `bar`)).toStrictEqual({
			match: `bar`,
			pattern: `bar`,
			substring: `bar`,
		})
		expect(matchesStringOrRegExp([`foo`, `baz`], `bar`)).toBe(false)

		expect(matchesStringOrRegExp(`bar`, [`foo`, `bar`])).toStrictEqual({
			match: `bar`,
			pattern: `bar`,
			substring: `bar`,
		})
		expect(matchesStringOrRegExp(`bar`, [`foo`, `baz`])).toBe(false)

		expect(matchesStringOrRegExp([`foo`, `baz`], [`foo`, `bar`])).toStrictEqual({
			match: `foo`,
			pattern: `foo`,
			substring: `foo`,
		})
		expect(matchesStringOrRegExp([`bar`, `hooha`], [`foo`, `baz`])).toBe(false)
	})

	it(`comparing with a RegExp comparisonValue`, () => {
		expect(matchesStringOrRegExp(`.foo`, `/\\.foo$/`)).toStrictEqual({
			match: `.foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		expect(matchesStringOrRegExp(`bar .foo`, `/\\.foo$/`)).toStrictEqual({
			match: `bar .foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		expect(matchesStringOrRegExp(`bar .foo bar`, `/\\.foo$/`)).toBe(false)
		expect(matchesStringOrRegExp(`foo`, `/\\.foo$/`)).toBe(false)

		expect(matchesStringOrRegExp([`.foo`, `bar`], `/\\.foo$/`)).toStrictEqual({
			match: `.foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		expect(matchesStringOrRegExp([`foo`, `baz`], `/\\.foo$/`)).toBe(false)

		expect(matchesStringOrRegExp(`.foo`, [`/\\.foo$/`, `/^bar/`])).toStrictEqual({
			match: `.foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		expect(matchesStringOrRegExp(`bar`, [`/\\.foo$/`, `/^bar/`])).toStrictEqual({
			match: `bar`,
			pattern: `/^bar/`,
			substring: `bar`,
		})
		expect(matchesStringOrRegExp(`ebarz`, [`/\\.foo$/`, `/^bar/`])).toBe(false)

		expect(matchesStringOrRegExp([`.foo`, `ebarz`], [`/\\.foo$/`, `/^bar/`])).toStrictEqual({
			match: `.foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		expect(matchesStringOrRegExp([`bar`, `foo`], [`/\\.foo$/`, `/^bar/`])).toStrictEqual({
			match: `bar`,
			pattern: `/^bar/`,
			substring: `bar`,
		})
		expect(matchesStringOrRegExp([`ebarz`, `foo`], [`/\\.foo$/`, `/^bar/`])).toBe(false)
		expect(matchesStringOrRegExp([`foobar`], [`/FOO/`])).toBe(false)
		expect(matchesStringOrRegExp([`FOOBAR`], [`/FOO/`])).toStrictEqual({
			match: `FOOBAR`,
			pattern: `/FOO/`,
			substring: `FOO`,
		})
	})

	it(`comparing with a actual RegExp comparisonValue`, () => {
		expect(matchesStringOrRegExp(`.foo`, /.foo$/)).toStrictEqual({
			match: `.foo`,
			pattern: /.foo$/,
			substring: `.foo`,
		})
		expect(matchesStringOrRegExp(`bar .foo`, /.foo$/)).toStrictEqual({
			match: `bar .foo`,
			pattern: /.foo$/,
			substring: `.foo`,
		})
		expect(matchesStringOrRegExp(`bar .foo bar`, /.foo$/)).toBe(false)
		expect(matchesStringOrRegExp(`foo`, /.foo$/)).toBe(false)
		expect(matchesStringOrRegExp([`.foo`, `ebarz`], [/.foo$/, /^bar/])).toStrictEqual({
			match: `.foo`,
			pattern: /.foo$/,
			substring: `.foo`,
		})
		expect(matchesStringOrRegExp([`foobar`], [/FOO/])).toBe(false)
		expect(matchesStringOrRegExp([`FOOBAR`], [/FOO/])).toStrictEqual({
			match: `FOOBAR`,
			pattern: /FOO/,
			substring: `FOO`,
		})
	})

	it(`comparing with an empty array`, () => {
		expect(matchesStringOrRegExp(`.foo`, [])).toBe(false)
	})
})
