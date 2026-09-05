import valueParser from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { readsSlashAsOperator } from "./index.ts"

/**
 * Asks about the first solidus of a value, with the nodes the parser puts beside it.
 * @param value - The value.
 * @returns What the util answers.
 */
function divides (value: string): boolean {
	let { nodes } = valueParser(value)
	let at = nodes.findIndex((node) => node.type === `div` && node.value === `/`)

	if (at === -1) throw new Error(`The value holds no solidus`)

	return readsSlashAsOperator(nodes[at - 1], nodes[at + 1])
}

describe(`readsSlashAsOperator`, () => {
	it(`divides beside a variable, whichever side of the solidus and whichever sign it stands with`, () => {
		expect(divides(`$a/2`)).toBe(true)
		expect(divides(`2/$a`)).toBe(true)
		expect(divides(`-$a/2`)).toBe(true)
		expect(divides(`2/-$a`)).toBe(true)
		expect(divides(`ns.$v/2`)).toBe(true)
	})

	it(`divides beside a call Sass may evaluate, and beside a parenthesised group`, () => {
		expect(divides(`fn()/2`)).toBe(true)
		expect(divides(`2/ns.fn()`)).toBe(true)
		expect(divides(`abs(-4)/2`)).toBe(true)
		expect(divides(`(4)/2`)).toBe(true)
	})

	it(`keeps the separator beside a call Sass hands through as plain CSS`, () => {
		expect(divides(`var(--x)/2`)).toBe(false)
		expect(divides(`2/VAR(--x)`)).toBe(false)
		expect(divides(`env(safe-area-inset-top)/2`)).toBe(false)
	})

	it(`keeps the separator between two plain values`, () => {
		expect(divides(`4/2`)).toBe(false)
		expect(divides(`4px/2px`)).toBe(false)
		expect(divides(`a/b`)).toBe(false)
		expect(divides(`"a"/2`)).toBe(false)
		expect(divides(`16/9 auto`)).toBe(false)
	})

	it(`answers no at either edge of a text`, () => {
		expect(divides(`/2`)).toBe(false)
		expect(divides(`$a/`)).toBe(true)
		expect(divides(`1/`)).toBe(false)
	})
})
