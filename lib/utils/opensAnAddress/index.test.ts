import valueParser from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { opensAnAddress } from "./index.ts"

/**
 * The names of the calls a value opens an address by, as the value parser hands them back.
 * @param value - The value to walk.
 * @returns The names, in the order the walk meets them.
 */
function addressesOf (value: string): string[] {
	let names: string[] = []

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

	// The second is the shape the gathering is for: the call's own name is empty, every letter of `url` standing in a word of its own in front of it. `lightningcss` compiles `\75 \72 \6c (13PX)` to `url("13PX")` and Sass to `url(13PX)`.
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

	// CSS counts the Windows pair as the one whitespace character closing an escape, and `lightningcss` reads `\75\r\nrl(x.png)` as an address; Sass alone answers `expected "("`, its own reading of the pair rather than of the name, so this spelling stands on the grammar and `lightningcss` where every other terminator has Sass behind it too.
	it(`a Windows pair closing the escape, which CSS counts as the one character`, () => {
		expect(addressesOf(`\\75\r\nrl(a)`)).toEqual([`rl`])
	})

	// See #579
	it(`an escaped backslash in front of the digits, which opens no escape and leaves the space dividing the value`, () => {
		expect(addressesOf(`x\\\\9 url(a)`)).toEqual([`url`])
		expect(addressesOf(`\\\\61 \\75 rl(a)`)).toEqual([`rl`])
		expect(addressesOf(`x\\\\\\9 url(a)`)).toEqual([])
	})

	it(`a second whitespace character, which closes no escape and divides the value instead`, () => {
		expect(addressesOf(`\\75  rl(a)`)).toEqual([])
	})

	it(`an escape no code point answers to, which spells the replacement character and no letter`, () => {
		expect(addressesOf(`\\0 rl(a)`)).toEqual([])
	})

	// Less and Sass compile `[c]url(http://a/b.png)` with the protocol's `//` whole, so the parentheses hold an address to both; `postcss-value-parser` hands the bracket back inside the word in front of the call (1789894076)
	it(`a square-bracket group in front of the name, which ends it to every tokenizer`, () => {
		expect(addressesOf(`[c]url(a)`)).toEqual([`[c]url`])
		expect(addressesOf(`[url(a)`)).toEqual([`[url`])
		expect(addressesOf(`]url(a)`)).toEqual([`]url`])
		expect(addressesOf(`[c]URL(a)`)).toEqual([`[c]URL`])
		expect(addressesOf(`[c]u\\rl(a)`)).toEqual([`[c]u\\rl`])
	})

	it(`a name of its own behind such a group`, () => {
		expect(addressesOf(`[c]aurl(a)`)).toEqual([])
		expect(addressesOf(`[c]\\61 url(a)`)).toEqual([])
	})

	// `@csstools/css-tokenizer` reads the escaped bracket as a character of the name, and Less and Sass refuse such a text
	it(`a bracket an escape covers, which ends nothing`, () => {
		expect(addressesOf(`[c\\]url(a)`)).toEqual([])
		expect(addressesOf(`\\]url(a)`)).toEqual([])
		expect(addressesOf(`\\\\]url(a)`)).toEqual([`\\\\]url`])
	})

	// `#{$p}url(` names the call `xurl` to Sass, and Less refuses an interpolation standing in a value outside a string at all; the comment scan reads both as a call too
	it(`an interpolation in front of the name, which is a character of it`, () => {
		expect(addressesOf(`#{$p}url(a)`)).toEqual([])
		expect(addressesOf(`@{p}url(a)`)).toEqual([])
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
