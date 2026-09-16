import valueParser, { type FunctionNode } from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { type CommentReading, findCommentSpans } from "../findCommentSpans/index.ts"

import { parenthesesRuns } from "./index.ts"

/** Plain CSS, where `//` opens no comment. */
const PLAIN_CSS: CommentReading = { spells: false, tokenizes: false, endsOnFormFeed: false }

/**
 * Reads the runs inside the parentheses of the first call of a plain CSS value.
 * @param value - The value.
 * @param reads - Whether a nested call's parentheses are read; every one of them unless said otherwise.
 * @returns The runs.
 */
function runsOf (value: string, reads: (call: FunctionNode) => boolean = () => true): string[] {
	let parsed = valueParser(value)
	let first = parsed.nodes.find((node) => node.type === `function`)

	return parenthesesRuns(first as FunctionNode, findCommentSpans(value, PLAIN_CSS), reads)
}

describe(`parenthesesRuns`, () => {
	it(`returns the run behind the opening parenthesis and the one in front of the closing one`, () => {
		expect(runsOf(`f( 1 )`)).toEqual([` `, ` `])
		expect(runsOf(`f(1)`)).toEqual([``, ``])
		expect(runsOf(`f(\n1\n)`)).toEqual([`\n`, `\n`])
	})

	it(`returns the runs of every call nested in it, which the rule writes in the same pass`, () => {
		expect(runsOf(`f( g( 1 ) )`)).toEqual([` `, ` `, ` `, ` `])
		expect(runsOf(`f(g(h( 1 )))`)).toEqual([``, ``, ``, ``, ` `, ` `])
	})

	it(`passes over a nested call the rule does not read, and the calls inside an address`, () => {
		expect(runsOf(`f( g( 1 ) )`, (call) => call.value !== `g`)).toEqual([` `, ` `])
		expect(runsOf(`f( url( a(b) ) )`)).toEqual([` `, ` `])
	})

	it(`passes over a call standing in a comment's text, which the file never writes`, () => {
		expect(runsOf(`f( 1 /* g( 2 ) */ )`)).toEqual([` `, ` `])
	})
})
