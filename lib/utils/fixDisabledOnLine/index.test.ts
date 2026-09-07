import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { fixDisabledOnLine } from "./index.ts"

const RULE = `@stylistic/declaration-block-trailing-semicolon`

/**
 * Builds the least of a Stylelint result that holds disabled ranges.
 * @param disabledRanges - The ranges, by the rule name a comment opened them under.
 * @param [ignoreDisables] - Whether the configuration ignores the disable comments.
 * @returns The result.
 */
function result (disabledRanges: Record<string, object[]>, ignoreDisables?: boolean): PostcssResult {
	return { stylelint: { config: { rules: {}, ignoreDisables }, disabledRanges } } as unknown as PostcssResult
}

describe(`fixDisabledOnLine`, () => {
	it(`a result carrying no range at all, or none of the rule's`, () => {
		expect(fixDisabledOnLine({} as unknown as PostcssResult, RULE, 1)).toBe(false)
		expect(fixDisabledOnLine(result({}), RULE, 1)).toBe(false)
		expect(fixDisabledOnLine(result({ "@stylistic/color-hex-case": [{ start: 1 }] }), RULE, 1)).toBe(false)
	})

	it(`a range opened over the rule, running to its last line or open-ended`, () => {
		expect(fixDisabledOnLine(result({ [RULE]: [{ start: 2, end: 4 }] }), RULE, 3)).toBe(true)
		expect(fixDisabledOnLine(result({ [RULE]: [{ start: 2, end: 4 }] }), RULE, 5)).toBe(false)
		expect(fixDisabledOnLine(result({ [RULE]: [{ start: 2 }] }), RULE, 9)).toBe(true)
		expect(fixDisabledOnLine(result({ [RULE]: [{ start: 2 }] }), RULE, 1)).toBe(false)
	})

	it(`a range opened over every rule, which the rule's own ranges stand in for where it has any`, () => {
		expect(fixDisabledOnLine(result({ all: [{ start: 1 }] }), RULE, 1)).toBe(true)
		expect(fixDisabledOnLine(result({ all: [{ start: 1 }], [RULE]: [{ start: 5 }] }), RULE, 1)).toBe(false)
	})

	it(`a range naming the rules it covers, and a configuration ignoring the comments`, () => {
		expect(fixDisabledOnLine(result({ [RULE]: [{ start: 1, rules: [`@stylistic/color-hex-case`] }] }), RULE, 1)).toBe(false)
		expect(fixDisabledOnLine(result({ [RULE]: [{ start: 1 }] }, true), RULE, 1)).toBe(false)
	})
})
