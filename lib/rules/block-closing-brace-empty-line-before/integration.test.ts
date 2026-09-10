import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

/**
 * Fixes one snippet under two rules and reads the output back under both; Stylelint runs the rules in the order the configuration spells them, so the object handed here decides which takes its turn first.
 * @param code - The snippet.
 * @param rules - The two rules, in the order the configuration is to spell them.
 * @returns The file the run left and how many warnings the pair still has about it.
 */
async function fix (code: string, rules: object): Promise<{
	code: string,
	warnings: number,
}> {
	let fixed = await stylelint.lint({ code, config: { plugins, rules }, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config: { plugins, rules } })

	return { code: fixed.code ?? code, warnings: pick(read.results).warnings.length }
}

/**
 * Asserts that the two orders of one pair leave the same file, and that neither leaves the pair anything to say.
 * @param code - The snippet.
 * @param partner - The other rule of the pair, as a configuration of one rule.
 * @param expected - The file both orders are to leave.
 * @returns Nothing.
 */
async function expectBothOrders (code: string, partner: object, expected: string): Promise<void> {
	let thisRuleFirst = await fix(code, { "@stylistic/block-closing-brace-empty-line-before": [`never`, { except: [`after-closing-brace`] }], ...partner })
	let partnerFirst = await fix(code, { ...partner, "@stylistic/block-closing-brace-empty-line-before": [`never`, { except: [`after-closing-brace`] }] })

	expect(thisRuleFirst).toEqual({ code: expected, warnings: 0 })
	expect(partnerFirst).toEqual({ code: expected, warnings: 0 })
}

// See #678
describe(`the empty line this rule writes beside a rule that writes the same run in front of the closing brace`, () => {
	it(`leaves one file in both orders of block-opening-brace-newline-after over a block holding nothing but a comment`, async () => {
		await expectBothOrders(`a {/*c*/ }\n`, { "@stylistic/block-opening-brace-newline-after": `always` }, `a {/*c*/\n\n }\n`)
	})

	it(`leaves one file in both orders of block-closing-brace-newline-before over the same block`, async () => {
		await expectBothOrders(`a {/*c*/ }\n`, { "@stylistic/block-closing-brace-newline-before": `always` }, `a {/*c*/\n\n }\n`)
	})

	it(`leaves one file in both orders of block-closing-brace-newline-before where a tab stands in front of the brace`, async () => {
		await expectBothOrders(`a {/*c*/\t}\n`, { "@stylistic/block-closing-brace-newline-before": `always` }, `a {/*c*/\n\n\t}\n`)
	})
})
