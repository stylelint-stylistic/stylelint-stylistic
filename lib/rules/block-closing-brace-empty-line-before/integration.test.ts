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
 * @param setting - This rule's setting.
 * @returns Nothing.
 */
async function expectBothOrders (code: string, partner: object, expected: string, setting: unknown = [`never`, { except: [`after-closing-brace`] }]): Promise<void> {
	let thisRuleFirst = await fix(code, { "@stylistic/block-closing-brace-empty-line-before": setting, ...partner })
	let partnerFirst = await fix(code, { ...partner, "@stylistic/block-closing-brace-empty-line-before": setting })

	expect(thisRuleFirst).toEqual({ code: expected, warnings: 0 })
	expect(partnerFirst).toEqual({ code: expected, warnings: 0 })
}

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

describe(`a custom property whose value is nothing but whitespace holding an empty line, beside declaration-block-trailing-semicolon under always`, () => {
	// The value keeps its breaks in front of the semicolon that rule writes, so the run in front of the brace is the empty one behind it, whichever rule is listed first
	it(`leaves one file in both orders under never, the empty line kept as the value`, async () => {
		await expectBothOrders(`a { --b:\n\n}\n`, { "@stylistic/declaration-block-trailing-semicolon": `always` }, `a { --b:\n\n;}\n`, `never`)
	})

	it(`leaves one file in both orders under never where the value is indented blank lines`, async () => {
		await expectBothOrders(`a {\n\t--b: \n\n\n}\n`, { "@stylistic/declaration-block-trailing-semicolon": `always` }, `a {\n\t--b: \n\n\n;}\n`, `never`)
	})
})

describe(`the empty line this rule writes where a stray semicolon stands behind the break, beside a rule taking the semicolon out`, () => {
	it(`leaves one file in both orders of no-extra-semicolons, the semicolon gone and one empty line before the brace`, async () => {
		await expectBothOrders(`a {/*c*/\n;}\n`, { "@stylistic/no-extra-semicolons": true }, `a {/*c*/\n\n}\n`)
	})

	it(`leaves one file in both orders of no-extra-semicolons where a tab stands between the break and the semicolon`, async () => {
		await expectBothOrders(`a {/*c*/\n\t;}\n`, { "@stylistic/no-extra-semicolons": true }, `a {/*c*/\n\n\t}\n`)
	})
})

describe(`a stray semicolon on a line of its own in front of the brace, beside a rule taking it out`, () => {
	// The semicolon a neighbor takes out is read as the whitespace it leaves, so both orders read the run the neighbor leaves
	it(`leaves one file in both orders of no-extra-semicolons under never`, async () => {
		await expectBothOrders(`a {\n\tb: c;\n;\n}\n`, { "@stylistic/no-extra-semicolons": true }, `a {\n\tb: c;\n}\n`, `never`)
	})

	it(`leaves one file in both orders of declaration-block-trailing-semicolon under never`, async () => {
		await expectBothOrders(`a {\n\tb: c;\n;\n}\n`, { "@stylistic/declaration-block-trailing-semicolon": `never` }, `a {\n\tb: c\n}\n`, `never`)
	})

	it(`leaves one file in both orders of declaration-block-trailing-semicolon under never behind a bodiless at-rule`, async () => {
		await expectBothOrders(`a {\n\t@import "b";\n;\n}\n`, { "@stylistic/declaration-block-trailing-semicolon": `never` }, `a {\n\t@import "b"\n}\n`, `never`)
	})

	it(`leaves one file in both orders of no-extra-semicolons under always-multi-line, the break the semicolon leaves counted`, async () => {
		await expectBothOrders(`a {\n\tb: c;\n;\n}\n`, { "@stylistic/no-extra-semicolons": true }, `a {\n\tb: c;\n\n}\n`, `always-multi-line`)
	})

	it(`leaves one file in both orders of declaration-block-trailing-semicolon under never where a disable comment stands on the declaration's line, which that rule reads on the semicolon's`, async () => {
		await expectBothOrders(`a {\n\tb: c; /* stylelint-disable-line @stylistic/declaration-block-trailing-semicolon */\n;\n}\n`, { "@stylistic/declaration-block-trailing-semicolon": `never` }, `a {\n\tb: c /* stylelint-disable-line @stylistic/declaration-block-trailing-semicolon */\n}\n`, `never`)
	})

	it(`leaves the semicolon a disable comment keeps from no-extra-semicolons on its line under always-multi-line, the empty line written behind it`, async () => {
		await expectBothOrders(`a {\n\tb: c;\n\t/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n;\n}\n`, { "@stylistic/no-extra-semicolons": true }, `a {\n\tb: c;\n\t/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n;\n\n}\n`, `always-multi-line`)
	})
})

describe(`a stray semicolon behind the closing brace of the last nested rule, beside a rule taking it out`, () => {
	// PostCSS files the semicolon with the run in front of it in the nested rule's raws, so the run in front of this brace is read across both, as the neighbor leaves it
	it(`leaves one file in both orders of no-extra-semicolons under never`, async () => {
		await expectBothOrders(`a {\n\tb {}\n;\n}`, { "@stylistic/no-extra-semicolons": true }, `a {\n\tb {}\n}`, `never`)
	})

	it(`leaves one file in both orders of no-extra-semicolons under always-multi-line, the break the semicolon leaves counted`, async () => {
		await expectBothOrders(`a {\n\tb {}\n;\n}`, { "@stylistic/no-extra-semicolons": true }, `a {\n\tb {}\n\n}`, `always-multi-line`)
	})
})
