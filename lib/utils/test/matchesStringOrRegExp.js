import { describe, it } from "node:test"
import { equal, deepEqual } from "node:assert/strict"

import matchesStringOrRegExp from "../matchesStringOrRegExp.js"

describe(`matchesStringOrRegExp`, () => {
	it(`comparing with string comparisonValues`, () => {
		deepEqual(matchesStringOrRegExp(`bar`, `bar`), {
			match: `bar`,
			pattern: `bar`,
			substring: `bar`,
		})
		equal(matchesStringOrRegExp(`bar`, `/bar something`), false)
		deepEqual(matchesStringOrRegExp(`/bar something`, `/bar something`), {
			match: `/bar something`,
			pattern: `/bar something`,
			substring: `/bar something`,
		})
		deepEqual(matchesStringOrRegExp(`bar something/`, `bar something/`), {
			match: `bar something/`,
			pattern: `bar something/`,
			substring: `bar something/`,
		})
		equal(matchesStringOrRegExp(`bar something/`, `bar something//`), false)

		deepEqual(matchesStringOrRegExp([`foo`, `bar`], `bar`), {
			match: `bar`,
			pattern: `bar`,
			substring: `bar`,
		})
		equal(matchesStringOrRegExp([`foo`, `baz`], `bar`), false)

		deepEqual(matchesStringOrRegExp(`bar`, [`foo`, `bar`]), {
			match: `bar`,
			pattern: `bar`,
			substring: `bar`,
		})
		equal(matchesStringOrRegExp(`bar`, [`foo`, `baz`]), false)

		deepEqual(matchesStringOrRegExp([`foo`, `baz`], [`foo`, `bar`]), {
			match: `foo`,
			pattern: `foo`,
			substring: `foo`,
		})
		equal(matchesStringOrRegExp([`bar`, `hooha`], [`foo`, `baz`]), false)
	})

	it(`comparing with a RegExp comparisonValue`, () => {
		deepEqual(matchesStringOrRegExp(`.foo`, `/\\.foo$/`), {
			match: `.foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		deepEqual(matchesStringOrRegExp(`bar .foo`, `/\\.foo$/`), {
			match: `bar .foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		equal(matchesStringOrRegExp(`bar .foo bar`, `/\\.foo$/`), false)
		equal(matchesStringOrRegExp(`foo`, `/\\.foo$/`), false)

		deepEqual(matchesStringOrRegExp([`.foo`, `bar`], `/\\.foo$/`), {
			match: `.foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		equal(matchesStringOrRegExp([`foo`, `baz`], `/\\.foo$/`), false)

		deepEqual(matchesStringOrRegExp(`.foo`, [`/\\.foo$/`, `/^bar/`]), {
			match: `.foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		deepEqual(matchesStringOrRegExp(`bar`, [`/\\.foo$/`, `/^bar/`]), {
			match: `bar`,
			pattern: `/^bar/`,
			substring: `bar`,
		})
		equal(matchesStringOrRegExp(`ebarz`, [`/\\.foo$/`, `/^bar/`]), false)

		deepEqual(matchesStringOrRegExp([`.foo`, `ebarz`], [`/\\.foo$/`, `/^bar/`]), {
			match: `.foo`,
			pattern: `/\\.foo$/`,
			substring: `.foo`,
		})
		deepEqual(matchesStringOrRegExp([`bar`, `foo`], [`/\\.foo$/`, `/^bar/`]), {
			match: `bar`,
			pattern: `/^bar/`,
			substring: `bar`,
		})
		equal(matchesStringOrRegExp([`ebarz`, `foo`], [`/\\.foo$/`, `/^bar/`]), false)
		equal(matchesStringOrRegExp([`foobar`], [`/FOO/`]), false)
		deepEqual(matchesStringOrRegExp([`FOOBAR`], [`/FOO/`]), {
			match: `FOOBAR`,
			pattern: `/FOO/`,
			substring: `FOO`,
		})
	})

	it(`comparing with a actual RegExp comparisonValue`, () => {
		deepEqual(matchesStringOrRegExp(`.foo`, /.foo$/), {
			match: `.foo`,
			pattern: /.foo$/,
			substring: `.foo`,
		})
		deepEqual(matchesStringOrRegExp(`bar .foo`, /.foo$/), {
			match: `bar .foo`,
			pattern: /.foo$/,
			substring: `.foo`,
		})
		equal(matchesStringOrRegExp(`bar .foo bar`, /.foo$/), false)
		equal(matchesStringOrRegExp(`foo`, /.foo$/), false)
		deepEqual(matchesStringOrRegExp([`.foo`, `ebarz`], [/.foo$/, /^bar/]), {
			match: `.foo`,
			pattern: /.foo$/,
			substring: `.foo`,
		})
		equal(matchesStringOrRegExp([`foobar`], [/FOO/]), false)
		deepEqual(matchesStringOrRegExp([`FOOBAR`], [/FOO/]), {
			match: `FOOBAR`,
			pattern: /FOO/,
			substring: `FOO`,
		})
	})

	it(`comparing with an empty array`, () => {
		equal(matchesStringOrRegExp(`.foo`, []), false)
	})
})
