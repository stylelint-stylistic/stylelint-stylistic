import valueParser from "postcss-value-parser"
import { expect, it } from "vitest"

import { weldEscapedWords } from "./index.ts"

/**
 * Reads one node, and the nodes of a function.
 * @param node - The node to read.
 * @returns Its type, text and span, and its nodes where it holds any.
 */
function readNode (node: valueParser.Node): unknown {
	return [node.type, node.value, node.sourceIndex, node.sourceEndIndex, ...(node.type === `function` ? [node.nodes.map(readNode)] : [])]
}

/**
 * Parses a value, welds its words, and hands back what the walk would see: each node's type, text and span.
 * @param value - The value to parse.
 * @returns One entry per node, functions with their nodes nested.
 */
function weldedNodesOf (value: string): unknown[] {
	let parsed = valueParser(value)

	weldEscapedWords(parsed.nodes)

	return parsed.nodes.map(readNode)
}

it(`weldEscapedWords`, () => {
	// A word ending in an escape open to the whitespace behind it, that one character, and a word are one word standing where the first did and ending where the last does
	expect(weldedNodesOf(`10px\\9 2PX`)).toEqual([[`word`, `10px\\9 2PX`, 0, 10]])
	expect(weldedNodesOf(`10P\\61 X`)).toEqual([[`word`, `10P\\61 X`, 0, 8]])
	expect(weldedNodesOf(`10px\\9\t2PX`)).toEqual([[`word`, `10px\\9\t2PX`, 0, 10]])
	expect(weldedNodesOf(`10px\\9\r\n2PX`)).toEqual([[`word`, `10px\\9\r\n2PX`, 0, 11]])

	// A word so made is asked again, so a chain is one word
	expect(weldedNodesOf(`10px\\9 2px\\9 3PX`)).toEqual([[`word`, `10px\\9 2px\\9 3PX`, 0, 16]])

	// The escape closes on one whitespace character, and a second parts the words
	expect(weldedNodesOf(`10px\\9  2PX`)).toEqual([[`word`, `10px\\9`, 0, 6], [`space`, `  `, 6, 8], [`word`, `2PX`, 8, 11]])

	// An escaped backslash in front of a digit opens no hexadecimal escape, and a seventh digit is a character of its own
	expect(weldedNodesOf(`10px\\\\9 2PX`)).toEqual([[`word`, `10px\\\\9`, 0, 7], [`space`, ` `, 7, 8], [`word`, `2PX`, 8, 11]])
	expect(weldedNodesOf(`10px\\0000611 2PX`)).toEqual([[`word`, `10px\\0000611`, 0, 12], [`space`, ` `, 12, 13], [`word`, `2PX`, 13, 16]])

	// Only a word is welded onto: a call, a comment or a string behind the space keeps its node
	expect(weldedNodesOf(`10px\\9 calc(1px)`).map((node) => (node as unknown[])[0])).toEqual([`word`, `space`, `function`])
	expect(weldedNodesOf(`10px\\9 /* c */`).map((node) => (node as unknown[])[0])).toEqual([`word`, `space`, `comment`])
	expect(weldedNodesOf(`10px\\9 "a"`).map((node) => (node as unknown[])[0])).toEqual([`word`, `space`, `string`])

	// A word standing in the text of a comment is welded onto nothing: the break behind the comment's text is the comment's end, whatever escape that text ends in
	let commented = valueParser(`1PX // 10PX\\9\n2REM`)

	weldEscapedWords(commented.nodes, [{ start: 4, end: 13, isInline: true }])
	expect(commented.nodes.map((node) => [node.type, node.value])).toEqual([[`word`, `1PX`], [`div`, `/`], [`div`, `/`], [`word`, `10PX\\9`], [`space`, `\n`], [`word`, `2REM`]])

	// The nodes of a call are welded as the value's own are, however deep
	expect(weldedNodesOf(`calc(min(10px\\9 2PX, 3PX))`)).toEqual([[`function`, `calc`, 0, 26, [[`function`, `min`, 5, 25, [[`word`, `10px\\9 2PX`, 9, 19], [`div`, `,`, 19, 21], [`word`, `3PX`, 21, 24]]]]]])
})
