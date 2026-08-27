import valueParser from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { opensAnAddress } from "./index.js"

/**
 * The names of the calls a value opens an address by, as the value parser hands them back.
 * @param {string} value - The value to walk.
 * @returns {string[]} The names, in the order the walk meets them.
 */
function addressesOf (value) {
	/** @type {string[]} */
	let names = []

	valueParser(value).walk((node, at, siblings) => {
		if (opensAnAddress(node, at, siblings)) names.push(node.value)
	}, false)

	return names
}

describe(`opensAnAddress`, () => {
	it(`the name as a file usually writes it, in either case`, () => {
		expect(addressesOf(`url(a)`)).toEqual([`url`])
		expect(addressesOf(`URL(a)`)).toEqual([`URL`])
	})

	it(`a letter of the name spelled by an escape the parser keeps with it`, () => {
		expect(addressesOf(`u\\rl(a)`)).toEqual([`u\\rl`])
		expect(addressesOf(`\\url(a)`)).toEqual([`\\url`])
		expect(addressesOf(`\\75\\72\\6c(a)`)).toEqual([`\\75\\72\\6c`])
	})

	it(`a hexadecimal escape closed by whitespace, which the parser hands back as a word and a call of two letters`, () => {
		expect(addressesOf(`\\75 rl(a)`)).toEqual([`rl`])
		expect(addressesOf(`\\55 RL(a)`)).toEqual([`RL`])
	})

	it(`a value standing in front of such a name, which is a value of its own and no part of it`, () => {
		expect(addressesOf(`a \\75 rl(b)`)).toEqual([`rl`])
	})

	// The second of these is the shape the gathering is for: the call's own name is empty, every letter of `url` standing in a word of its own in front of it. `lightningcss` compiles `\75 \72 \6c (13PX)` to `url("13PX")` and Sass to `url(13PX)`.
	it(`a name gathered from several such escapes, which spells the name all the same`, () => {
		expect(addressesOf(`\\75 \\72 l(a)`)).toEqual([`l`])
		expect(addressesOf(`\\75 \\72 \\6c (a)`)).toEqual([``])
	})

	it(`a name gathered from several such escapes, which spells a name of its own`, () => {
		expect(addressesOf(`\\61 \\75 rl(a)`)).toEqual([])
	})

	it(`an escape welding the name to what stands in front of it, which the value parser hands back as a call named url`, () => {
		expect(addressesOf(`\\61 url(a)`)).toEqual([])
		expect(addressesOf(`\\7 url(a)`)).toEqual([])
	})

	it(`a name ending in those three letters while being a name of its own`, () => {
		expect(addressesOf(`image-url(a)`)).toEqual([])
		expect(addressesOf(`image-\\75 rl(a)`)).toEqual([])
		expect(addressesOf(`a\\url(a)`)).toEqual([])
		expect(addressesOf(`urls(a)`)).toEqual([])
	})

	// CSS counts the Windows pair as the one whitespace character closing an escape, and `lightningcss` reads `\75\r\nrl(x.png)` as an address. Sass parts company here alone, answering `expected "("` — its own reading of the pair rather than anything about the name — so this spelling stands on the grammar and on `lightningcss`, where every other terminator has Sass behind it too.
	it(`a Windows pair closing the escape, which CSS counts as the one character`, () => {
		expect(addressesOf(`\\75\r\nrl(a)`)).toEqual([`rl`])
	})

	it(`a second whitespace character, which closes no escape and divides the value instead`, () => {
		expect(addressesOf(`\\75  rl(a)`)).toEqual([])
	})

	it(`an escape no code point answers to, which spells the replacement character and no letter`, () => {
		expect(addressesOf(`\\0 rl(a)`)).toEqual([])
	})

	it(`a node that is no call at all`, () => {
		expect(addressesOf(`url`)).toEqual([])
		expect(addressesOf(`"url(a)"`)).toEqual([])
	})

	it(`an address standing inside a call, and a call standing inside an address`, () => {
		expect(addressesOf(`f(u\\rl(a))`)).toEqual([`u\\rl`])
		expect(addressesOf(`u\\rl(f(a))`)).toEqual([`u\\rl`])
	})
})
