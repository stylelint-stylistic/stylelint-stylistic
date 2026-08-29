import postcssLess from "postcss-less"
import { describe, expect, it } from "vitest"

import { isLessDetachedRulesetCall } from "./index.ts"

describe(`isLessDetachedRulesetCall`, () => {
	it(`a call to a detached ruleset`, () => {
		expect(isLessDetachedRulesetCall(lessAtRule(`@dr: { color: red; }; a { @dr(); }`, 1))).toBe(true)
	})

	it(`a call to a detached ruleset spelled with a space in front of its parentheses, which Less reads as an at-rule`, () => {
		expect(isLessDetachedRulesetCall(lessAtRule(`@dr: { color: red; }; a { @dr (); }`, 1))).toBe(false)
	})

	it(`a call to a detached ruleset carrying a lookup, which Less inlines as it inlines the bare call`, () => {
		expect(isLessDetachedRulesetCall(lessAtRule(`@dr: { color: red; }; a { @dr()[k]; }`, 1))).toBe(true)
	})

	it(`a call to a detached ruleset spelled with whitespace inside its parentheses, which Less reads as an at-rule too`, () => {
		expect(isLessDetachedRulesetCall(lessAtRule(`@dr: { color: red; }; a { @dr( ); }`, 1))).toBe(false)
	})

	it(`the declaration of a detached ruleset`, () => {
		expect(isLessDetachedRulesetCall(lessAtRule(`@dr: { color: red; };`))).toBe(false)
	})

	it(`an at-rule spelled without a space in front of its options`, () => {
		expect(isLessDetachedRulesetCall(lessAtRule(`a { @import(reference) "x"; }`))).toBe(false)
	})

	it(`an at-rule whose options are a pair of parentheses holding one word`, () => {
		expect(isLessDetachedRulesetCall(lessAtRule(`a { @layer(l); }`))).toBe(false)
	})

	it(`a mixin call, which carries the same empty argument list and its own mark`, () => {
		expect(isLessDetachedRulesetCall(lessAtRule(`a { .mixin(); }`))).toBe(false)
	})

	it(`an at-rule carrying a block and an empty argument list, which no call to a detached ruleset has`, () => {
		expect(isLessDetachedRulesetCall(lessAtRule(`@media() {}`))).toBe(false)
	})
})

/**
 * Reads one at-rule of a stylesheet written in Less.
 * @param code - The stylesheet.
 * @param index - Which at-rule, counted in the order the walk meets them.
 * @returns That at-rule.
 */
function lessAtRule (code: string, index: number = 0): import("postcss").AtRule {
	let atRules: import("postcss").AtRule[] = []

	postcssLess.parse(code).walkAtRules((atRule) => {
		atRules.push(atRule)
	})

	return atRules[index]
}
