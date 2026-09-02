import valueParser, { type FunctionNode, type Node as ValueNode } from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { splitSpaceNodesAtWords } from "./index.ts"

/**
 * Parses a value, splits the whitespace nodes of its functions, and hands back the first node as the function it is expected to be.
 * @param value - The value to parse, opening on a function.
 * @returns The first node of the parsed value.
 */
function splitFirstFunction (value: string): FunctionNode {
	let parsed = valueParser(value)

	splitSpaceNodesAtWords(parsed.nodes)

	let [node] = parsed.nodes

	if (!node || node.type !== `function`) throw new Error(`The value does not open on a function`)

	return node
}

/**
 * Reads the fields of a node the assertions below compare.
 * @param node - The node to read.
 * @returns Its type, text and position.
 */
function pick (node: ValueNode): {
	type: string,
	value: string,
	sourceIndex: number,
	sourceEndIndex: number,
} {
	let { type, value, sourceIndex, sourceEndIndex } = node

	return { type, value, sourceIndex, sourceEndIndex }
}

describe(`splitSpaceNodesAtWords`, () => {
	it(`a space node holding a vertical tab, which the tokenizer reads as a word: the node is cut into the runs and the word, each at the position the file spells it at`, () => {
		let funcNode = splitFirstFunction(`f(x \v y)`)

		expect(funcNode.nodes.map(pick)).toStrictEqual([
			{ type: `word`, value: `x`, sourceIndex: 2, sourceEndIndex: 3 },
			{ type: `space`, value: ` `, sourceIndex: 3, sourceEndIndex: 4 },
			{ type: `word`, value: `\v`, sourceIndex: 4, sourceEndIndex: 5 },
			{ type: `space`, value: ` `, sourceIndex: 5, sourceEndIndex: 6 },
			{ type: `word`, value: `y`, sourceIndex: 6, sourceEndIndex: 7 },
		])
	})

	it(`a function's own before and after keep only the run touching their parenthesis, the rest joining the nodes`, () => {
		let funcNode = splitFirstFunction(`f(\v x,y\v )`)

		expect(funcNode.before).toBe(``)
		expect(funcNode.after).toBe(` `)
		expect(funcNode.nodes[0] && pick(funcNode.nodes[0])).toStrictEqual({ type: `word`, value: `\v`, sourceIndex: 2, sourceEndIndex: 3 })
		expect(funcNode.nodes.at(-1)).toStrictEqual({ type: `word`, value: `\v`, sourceIndex: 7, sourceEndIndex: 8 })
		expect(valueParser.stringify(funcNode)).toBe(`f(\v x,y\v )`)
	})

	it(`a nested function is rewritten too`, () => {
		let outer = splitFirstFunction(`f(g(\vx))`)
		let [inner] = outer.nodes

		if (!inner || inner.type !== `function`) throw new Error(`The function does not open on a function`)

		expect(inner.before).toBe(``)
		expect(inner.nodes.map(pick)).toStrictEqual([
			{ type: `word`, value: `\v`, sourceIndex: 4, sourceEndIndex: 5 },
			{ type: `word`, value: `x`, sourceIndex: 5, sourceEndIndex: 6 },
		])
	})

	it(`a value whose whitespace is all the tokenizer's is left as parsed`, () => {
		let funcNode = splitFirstFunction(`f( x,\n y )`)

		expect(funcNode.before).toBe(` `)
		expect(funcNode.after).toBe(` `)
		expect(funcNode.nodes.map(({ type }) => type)).toStrictEqual([`word`, `div`, `word`])
	})
})
