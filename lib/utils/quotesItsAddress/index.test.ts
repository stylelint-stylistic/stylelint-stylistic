import valueParser from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { quotesItsAddress } from "./index.ts"

/**
 * Asks the question of the first node a value parses to.
 * @param value - The value holding the call.
 * @returns The answer.
 */
function quotes (value: string): boolean {
	return quotesItsAddress(valueParser(value).nodes[0] as valueParser.Node)
}

describe(`quotesItsAddress`, () => {
	it(`a string against the parenthesis, alone or with arguments behind it`, () => {
		expect(quotes(`url("a")`)).toBe(true)
		expect(quotes(`url('a', format("woff2"))`)).toBe(true)
	})

	it(`a string behind whitespace, which the parser hands back as the first node all the same`, () => {
		expect(quotes(`url( "a" )`)).toBe(true)
		expect(quotes(`url(\n"a",f(1))`)).toBe(true)
	})

	it(`a string under a name spelled other than url, which the parser reads out of its url mode`, () => {
		expect(quotes(`URL("a",f(1))`)).toBe(true)
		expect(quotes(`u\\rl("a",f(1))`)).toBe(true)
	})

	// PostCSS takes the parentheses of url( behind such a character as one token, and Sass and Less refuse the file
	it(`a string behind a vertical tab or another control character, which the parser passes over as whitespace and the tokenizer does not`, () => {
		expect(quotes(`url(\v"a",f(1))`)).toBe(false)
		expect(quotes(`url(\u0001"a",f(1))`)).toBe(false)
		expect(quotes(`URL( \v"a",f(1))`)).toBe(false)
	})

	it(`a bare address, and one a comment or a word opens in front of a string`, () => {
		expect(quotes(`url(a)`)).toBe(false)
		expect(quotes(`URL(a, "b")`)).toBe(false)
		expect(quotes(`url(/* c */ "a")`)).toBe(false)
		expect(quotes(`URL(/* c */ "a")`)).toBe(false)
	})

	it(`a node that is no call`, () => {
		expect(quotes(`"a"`)).toBe(false)
		expect(quotes(`url`)).toBe(false)
	})
})
