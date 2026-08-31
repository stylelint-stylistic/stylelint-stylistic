import valueParser, { type FunctionNode } from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"

import { isStandardSyntaxFunction } from "./index.ts"

describe(`isStandardSyntaxFunction`, () => {
	it(`calc`, () => {
		expect(isStandardSyntaxFunction(getFunction(`calc(a + b)`))).toBe(true)
	})

	it(`url`, () => {
		expect(isStandardSyntaxFunction(getFunction(`url('x.css')`))).toBe(true)
	})

	it(`a parenthesised group inside a call, which is no call of its own`, () => {
		expect(isStandardSyntaxFunction(getFunction(`(1px + 2px) * 2`))).toBe(false)
	})

	it(`scss list`, () => {
		// as in $list: (list)
		expect(isStandardSyntaxFunction(getFunction(`(list)`))).toBe(false)
	})

	it(`CSS-in-JS interpolation`, () => {
		expect(isStandardSyntaxFunction(getFunction(`\${({ size }) => (size === "small") ? "0.8em" : "1em"}`))).toBe(false)
	})

	it(`CSS-in-JS syntax`, () => {
		expect(isStandardSyntaxFunction(getFunction(`\`calc(\${token.radiusBase} + 2px)\``))).toBe(false)
	})
})

/**
 * Reads the first call of a value.
 * @param declValue - The value.
 * @returns That call.
 */
function getFunction (declValue: string): FunctionNode {
	let functions: FunctionNode[] = []

	valueParser(declValue).walk((valueNode) => {
		if (valueNode.type === `function`) functions.push(valueNode)
	})

	return pick(functions)
}
