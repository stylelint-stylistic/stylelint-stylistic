import { type ChildNode, parse, type Root } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { nodeBehindEndOfLineComments } from "./index.ts"

describe(`nodeBehindEndOfLineComments`, () => {
	it(`the node behind an end-of-line comment, whose run holds no break`, () => {
		expect(check(`@import 'x'; /* c */\na {}`)).toBe(`a {}`)
		expect(check(`@import 'x';/* c */ /* d */\na {}`)).toBe(`a {}`)
	})

	it(`the comment itself where its run holds a break, whatever follows it`, () => {
		expect(check(`@import 'x';\n/* c */ a {}`)).toBe(`/* c */`)
		expect(check(`@import 'x'; /* c */\n/* d */ a {}`)).toBe(`/* d */`)
		expect(check(`@import 'x'; \n/* c */`)).toBe(`/* c */`)
	})

	it(`the comment itself where a stray semicolon kept in its run stands in for a node, with or without a break`, () => {
		expect(check(`@import 'x';;\n/* c */\na {}`)).toBe(`/* c */`)
		expect(check(`@import 'x';;/* c */\na {}`)).toBe(`/* c */`)
	})

	it(`the node behind the comments where the rule about extra semicolons takes the stray one out of the run`, () => {
		expect(check(`@import 'x';;/* c */\na {}`, { "@stylistic/no-extra-semicolons": true })).toBe(`a {}`)
	})

	it(`null where every node from the start is an end-of-line comment`, () => {
		expect(check(`@import 'x'; /* c */`)).toBe(null)
		expect(check(`@import 'x';`)).toBe(null)
	})
})

/**
 * Reads the node judged behind the first statement of a stylesheet, as its text.
 * @param code - The stylesheet.
 * @param rules - The configuration's rules.
 * @returns The node's text, or null.
 */
function check (code: string, rules: Record<string, unknown> = {}): string | null {
	let root: Root = parse(code)
	let result = { stylelint: { config: { rules }, ruleSeverities: {}, customMessages: {}, ruleMetadata: {}, disabledRanges: {} }, opts: {}, root } as unknown as PostcssResult
	let node = nodeBehindEndOfLineComments((root.first as ChildNode).next(), result)

	return node ? node.toString().trim() : null
}
