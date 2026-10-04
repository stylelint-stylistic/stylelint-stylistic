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

describe(`the empty line this rule would write into the run behind an opening brace, beside the rule writing that run and refusing every break in it`, () => {
	// The run in front of the closing brace of a block holding nothing but comments is the run behind the opening brace, so `never-multi-line` there takes both breaks of an empty line back out and no file satisfies both; the reversal asks for nothing there, and the pair settles in one pass in either order
	it(`leaves a block holding nothing but a comment on one line in both orders of block-opening-brace-newline-after under never-multi-line`, async () => {
		await expectBothOrders(`a {/*c*/ }\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `a {/*c*/ }\n`)
	})

	// The same block written in several lines, which that option reads as one no break may stand in
	it(`leaves the same block written in several lines on that rule's own spelling in both orders under never-multi-line`, async () => {
		await expectBothOrders(`a {\n\t/*c*/\n}\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `a {\t/*c*/}\n`)
	})

	it(`leaves a block holding nothing but two comments on the same spelling in both orders under never-multi-line`, async () => {
		await expectBothOrders(`a {\n\t/*c1*/\n\t/*c2*/\n}\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `a {\t/*c1*/\t/*c2*/}\n`)
	})

	it(`leaves an at-rule holding nothing but a comment on the same spelling in both orders under never-multi-line`, async () => {
		await expectBothOrders(`@media print {\n\t/*c*/\n}\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `@media print {\t/*c*/}\n`)
	})

	// A turned-off fix leaves the claim standing: that rule still reports a break there and takes none out
	it(`leaves a block holding nothing but a comment on one line in both orders with that rule's fix turned off`, async () => {
		await expectBothOrders(`a {/*c*/ }\n`, { "@stylistic/block-opening-brace-newline-after": [`never-multi-line`, { disableFix: true }] }, `a {/*c*/ }\n`)
	})

	// `ignore: ["rules"]` takes that rule off the rules alone, so it forbids nothing there and the empty line the reversal asks for stands; its at-rule walk stands whatever the option says
	it(`keeps the empty line over a rule that rule's ignore takes it off, and writes none over an at-rule it stays on, both orders under never-multi-line`, async () => {
		let setting: object = [`never-multi-line`, { ignore: [`rules`] }]

		await expectBothOrders(`a {/*c*/ }\n`, { "@stylistic/block-opening-brace-newline-after": setting }, `a {/*c*/\n\n }\n`)
		await expectBothOrders(`@media print {/*c*/ }\n`, { "@stylistic/block-opening-brace-newline-after": setting }, `@media print {/*c*/ }\n`)
	})

	// A stray semicolon standing in the block is no node of it, so the block holds nothing but the comment and the reversal asks the rule about the run in front of the brace
	it(`leaves a block holding nothing but a comment with a stray semicolon behind it on one line in both orders under never-multi-line`, async () => {
		await expectBothOrders(`a {\n\t/*c*/;\n}\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `a {\t/*c*/;\n}\n`)
	})

	// The rule reports the run in front of the closing brace on the line the opening brace stands on, which a head written in several lines leaves below the line a disable comment may stand on
	it(`keeps the empty line where a disable comment keeps that rule off the brace's line below a head of two lines, and writes none where the comment stands above it, both orders under never-multi-line`, async () => {
		let partner = { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }

		await expectBothOrders(`a,\nb /* stylelint-disable-line @stylistic/block-opening-brace-newline-after */ {/*c*/ }\n`, partner, `a,\nb /* stylelint-disable-line @stylistic/block-opening-brace-newline-after */ {/*c*/\n\n }\n`)
		await expectBothOrders(`a, /* stylelint-disable-line @stylistic/block-opening-brace-newline-after */\nb {/*c*/ }\n`, partner, `a, /* stylelint-disable-line @stylistic/block-opening-brace-newline-after */\nb {/*c*/ }\n`)
		await expectBothOrders(`a,\n/* stylelint-disable-next-line @stylistic/block-opening-brace-newline-after */\nb {/*c*/ }\n`, partner, `a,\n/* stylelint-disable-next-line @stylistic/block-opening-brace-newline-after */\nb {/*c*/\n\n }\n`)
		await expectBothOrders(`/* stylelint-disable-next-line @stylistic/block-opening-brace-newline-after */\na,\nb {/*c*/ }\n`, partner, `/* stylelint-disable-next-line @stylistic/block-opening-brace-newline-after */\na,\nb {/*c*/ }\n`)
	})

	it(`writes no empty line over an at-rule whose head of two lines a disable comment keeps that rule off of, both orders under never-multi-line`, async () => {
		await expectBothOrders(`@media print and /* stylelint-disable-line @stylistic/block-opening-brace-newline-after */\n\t(min-width: 1px) {\n\t/*c*/\n}\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `@media print and /* stylelint-disable-line @stylistic/block-opening-brace-newline-after */\n\t(min-width: 1px) {\t/*c*/}\n`)
	})

	// A disable comment takes the report away, and a rule that reports nothing forbids nothing, so the empty line the reversal asks for stands
	it(`keeps the empty line where a disable comment keeps that rule off the block's line, and the comment with it`, async () => {
		await expectBothOrders(`/* stylelint-disable-next-line @stylistic/block-opening-brace-newline-after */\na {/*c*/ }\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `/* stylelint-disable-next-line @stylistic/block-opening-brace-newline-after */\na {/*c*/\n\n }\n`)
	})

	it(`keeps the empty line where a disable comment keeps that rule off the whole file, and the comment with it`, async () => {
		await expectBothOrders(`/* stylelint-disable @stylistic/block-opening-brace-newline-after */\na {/*c*/ }\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `/* stylelint-disable @stylistic/block-opening-brace-newline-after */\na {/*c*/\n\n }\n`)
	})
})

describe(`the empty line this rule writes where the run behind an opening brace takes one break the other way`, () => {
	// `always` writes a break of its own and takes both breaks of an empty line for one, so the reversal stands over a block holding nothing but comments
	it(`keeps the empty line in both orders of block-opening-brace-newline-after under always`, async () => {
		await expectBothOrders(`a {\n\t/*c*/\n}\n`, { "@stylistic/block-opening-brace-newline-after": `always` }, `a {\n\t/*c*/\n\n}\n`)
	})

	it(`keeps the empty line in both orders of no such rule at all`, async () => {
		await expectBothOrders(`a {\n\t/*c*/\n}\n`, {}, `a {\n\t/*c*/\n\n}\n`)
	})
})

describe(`the empty line this rule would write where the neighbor does not read the run in front of the closing brace`, () => {
	// A block holding a nested rule has no declaration, so the reversal asks for the empty line, and that rule writes the run behind its own opening brace rather than the one in front of the outer closing brace
	it(`writes the empty line in both orders of block-opening-brace-newline-after under never-multi-line over a nested rule`, async () => {
		await expectBothOrders(`a {\n\tb { color: red }\n}\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `a {b { color: red }\n\n}\n`)
	})

	// A block holding a declaration is no block the reversal touches at all
	it(`writes no empty line in both orders of block-opening-brace-newline-after under never-multi-line over a declaration`, async () => {
		await expectBothOrders(`a {\n\tcolor: red\n}\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `a {color: red\n}\n`)
	})

	it(`writes the empty line in both orders of block-opening-brace-newline-after under never-multi-line over a declaration under always-multi-line`, async () => {
		await expectBothOrders(`a {\n\tcolor: red\n}\n`, { "@stylistic/block-opening-brace-newline-after": `never-multi-line` }, `a {color: red\n\n}\n`, `always-multi-line`)
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

describe(`the place of the warning where a neighbor has taken characters out in front of the brace`, () => {
	// Stylelint counts the warning's index over the file from the statement's start, so an index counted over the rewritten print landed on a line above the brace, under the comment disabling this rule there, and the warning was dropped with its fix
	it(`stands on the brace's line past a comment disabling this rule on a line above, in both orders of no-eol-whitespace under always-multi-line`, async () => {
		let code = `a {\n  b: c; /* stylelint-disable-line @stylistic/block-closing-brace-empty-line-before */${` `.repeat(40)}\n  d: e;\n}\n`

		await expectBothOrders(code, { "@stylistic/no-eol-whitespace": true }, `a {\n  b: c; /* stylelint-disable-line @stylistic/block-closing-brace-empty-line-before */\n  d: e;\n\n}\n`, `always-multi-line`)
	})

	it(`stands on the brace's line past a comment disabling every rule on a line above, in both orders of the three neighbors taking the spaces, the semicolon and the empty line out under never`, async () => {
		let neighbors = { "@stylistic/no-extra-semicolons": true, "@stylistic/no-eol-whitespace": true, "@stylistic/max-empty-lines": 1 }

		await expectBothOrders(`a {\n  b: c;  \n  d: e;\n/* stylelint-disable-line */\n ;\n \n}\n`, neighbors, `a {\n  b: c;\n  d: e;\n/* stylelint-disable-line */\n}\n`, `never`)
		await expectBothOrders(`a {\r\n  b: c;  \r\n  d: e;\r\n/* stylelint-disable-line */\r\n ;\r\n \r\n}\r\n`, neighbors, `a {\r\n  b: c;\r\n  d: e;\r\n/* stylelint-disable-line */\r\n}\r\n`, `never`)
	})
})
