import { parse, type Rule } from "postcss"
import { parse as parseLess } from "postcss-less"
import { describe, expect, it } from "vitest"

import { closingOffset } from "./index.ts"

describe(`closingOffset`, () => {
	it(`the offset behind the closing brace, or behind the stray semicolon PostCSS files there`, () => {
		expect(closingOffset(parse(`a { b: c; }`).first as Rule)).toBe(11)
		expect(closingOffset(parse(`a { b: c; } ;`).first as Rule)).toBe(13)
	})

	it(`nothing for a container opened in front of a Less comment whose string runs over its break, which postcss-less ends in another text`, () => {
		let block = parseLess(`a { // "\n  b: c;;\n  e { f: g;; } ;\n} ;\n`).first as Rule

		expect(closingOffset(block)).toBeUndefined()
	})
})
