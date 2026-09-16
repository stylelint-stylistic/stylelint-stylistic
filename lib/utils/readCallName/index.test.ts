import valueParser from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { type CallName, readCallName } from "./index.ts"

/**
 * The names the calls of a value spell, with where each opens.
 * @param value - The value to walk.
 * @returns The names, in the order the walk meets them.
 */
function namesOf (value: string): CallName[] {
	let names: CallName[] = []

	valueParser(value).walk((node, at, siblings) => {
		if (node.type === `function`) names.push(readCallName(node, at, siblings))
	}, false)

	return names
}

describe(`readCallName`, () => {
	it(`the name as the parser hands it back, opening where the call does`, () => {
		expect(namesOf(`1px url(a) f(b)`)).toStrictEqual([{ name: `url`, sourceIndex: 4 }, { name: `f`, sourceIndex: 11 }])
	})

	it(`a hexadecimal escape closed by whitespace, which the parser hands back as a word and a call, joined and opening at the word`, () => {
		expect(namesOf(`1px \\75 rl(a)`)).toStrictEqual([{ name: `\\75 rl`, sourceIndex: 4 }])
	})

	it(`a name gathered from several such escapes`, () => {
		expect(namesOf(`\\75 \\72 \\6c (a)`)).toStrictEqual([{ name: `\\75 \\72 \\6c `, sourceIndex: 0 }])
	})

	it(`a divider and a word in front of the escape, which the parser keeps in the word and the name opens on`, () => {
		expect(namesOf(`a\\\n\\75 rl(b)`)).toStrictEqual([{ name: `a\\\n\\75 rl`, sourceIndex: 0 }])
	})

	it(`a word in front of the name that is a value of its own, and a second whitespace character, which closes no escape`, () => {
		expect(namesOf(`a \\75 rl(b)`)).toStrictEqual([{ name: `\\75 rl`, sourceIndex: 2 }])
		expect(namesOf(`\\75  rl(b)`)).toStrictEqual([{ name: `rl`, sourceIndex: 5 }])
	})
})
