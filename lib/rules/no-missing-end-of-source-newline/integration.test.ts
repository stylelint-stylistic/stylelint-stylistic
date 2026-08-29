import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * Fixes one snippet under two rules and reads the output back under both of them.
 *
 * Stylelint runs each rule once and in the order the configuration spells them, so the object handed here decides which of the two takes its turn first.
 * @param code - The snippet.
 * @param rules - The two rules, in the order the configuration is to spell them.
 * @returns What the run left behind and how much of it the pair still has to say about.
 */
async function fix (code: string, rules: object): Promise<{ code: string, warnings: number }> {
	let fixed = await stylelint.lint({ code, config: { plugins, rules }, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config: { plugins, rules } })

	return { code: fixed.code ?? code, warnings: read.results[0].warnings.length }
}

/**
 * Asserts that the two orders of one pair leave the same file, and that neither leaves the pair anything to say.
 * @param code - The snippet.
 * @param partner - The other rule of the pair, as a configuration of one rule.
 * @param expected - The file both orders are to leave.
 * @returns Nothing.
 */
async function expectBothOrders (code: string, partner: object, expected: string): Promise<void> {
	let thisRuleFirst = await fix(code, { "@stylistic/no-missing-end-of-source-newline": true, ...partner })
	let partnerFirst = await fix(code, { ...partner, "@stylistic/no-missing-end-of-source-newline": true })

	expect(thisRuleFirst).toEqual({ code: expected, warnings: 0 })
	expect(partnerFirst).toEqual({ code: expected, warnings: 0 })
}

// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/390
describe(`the output of no-missing-end-of-source-newline beside a rule that writes into the end of the file`, () => {
	it(`closes a file ending on a free semicolon the same way in both orders of no-extra-semicolons`, async () => {
		await expectBothOrders(`@media all { a {} }\n;`, { "@stylistic/no-extra-semicolons": true }, `@media all { a {} }\n\n`)
	})

	it(`does the same where a comment is what the semicolon stands behind`, async () => {
		await expectBothOrders(`/* c */\n;`, { "@stylistic/no-extra-semicolons": true }, `/* c */\n\n`)
	})

	it(`closes a file ending on an empty line and a run of spaces the same way in both orders of max-empty-lines`, async () => {
		await expectBothOrders(`a { color: pink; }\n\n   `, { "@stylistic/max-empty-lines": 1 }, `a { color: pink; }\n`)
	})

	it(`does the same where the option allows one empty line more than the file ends on`, async () => {
		await expectBothOrders(`a { color: pink; }\n\n\n   `, { "@stylistic/max-empty-lines": 2 }, `a { color: pink; }\n\n`)
	})
})
