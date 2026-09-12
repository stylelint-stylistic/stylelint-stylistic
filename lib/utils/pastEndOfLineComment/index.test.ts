import { type ChildNode, parse } from "postcss"
import { describe, expect, it } from "vitest"

import { pastEndOfLineComment } from "./index.ts"

describe(`pastEndOfLineComment`, () => {
	it(`a node that is no comment, which is the one read`, () => {
		expect(behind(`a {}b {}`)).toBe(`b {}`)
		expect(behind(`a {} b {}`)).toBe(`b {}`)
		expect(behind(`a {}\nb {}`)).toBe(`b {}`)
	})

	it(`a comment ending the brace's line, which is read past`, () => {
		expect(behind(`a {}/*c*/b {}`)).toBe(`b {}`)
		expect(behind(`a {} /*c*/ b {}`)).toBe(`b {}`)
		expect(behind(`a {}  /*c*/\nb {}`)).toBe(`b {}`)
	})

	it(`a gap of anything but spaces, which keeps the comment the node read`, () => {
		expect(behind(`a {}\t/*c*/ b {}`)).toBe(`/*c*/`)
		expect(behind(`a {}\n/*c*/ b {}`)).toBe(`/*c*/`)
		expect(behind(`a {}\f/*c*/ b {}`)).toBe(`/*c*/`)
	})

	it(`a comment carrying a line break, which ends no line`, () => {
		expect(behind(`a {} /*c\n*/ b {}`)).toBe(`/*c\n*/`)
		expect(behind(`a {} /*c\r\n*/ b {}`)).toBe(`/*c\r\n*/`)
	})

	it(`a comment ending the block or the file, behind which nothing stands`, () => {
		expect(behind(`a {} /*c*/`)).toBeUndefined()
		expect(behind(`@media print { a {} /*c*/ }`, true)).toBeUndefined()
	})
})

/**
 * Prints what the util reads behind the first block of a stylesheet.
 * @param code - The stylesheet.
 * @param nested - Whether the block stands inside the first node.
 * @returns The node's text, or nothing.
 */
function behind (code: string, nested: boolean = false): string | undefined {
	let root = parse(code)
	let statement = (nested ? (root.first as unknown as { first: ChildNode }).first : root.first) as ChildNode
	let next = statement.next()

	return next && pastEndOfLineComment(next)?.toString()
}
