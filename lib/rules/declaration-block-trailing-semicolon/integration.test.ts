import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"
import { ruleName as atRuleSpaceBeforeRuleName } from "../at-rule-semicolon-space-before/index.ts"
import { messages as newlineBeforeMessages, ruleName as newlineBeforeRuleName } from "../declaration-block-semicolon-newline-before/index.ts"
import { messages as spaceBeforeMessages, ruleName as spaceBeforeRuleName } from "../declaration-block-semicolon-space-before/index.ts"

import { messages, ruleName } from "./index.ts"

let testRuleListedFirst = createTestRule({ ruleName })

// A `declaration-block-semicolon-*-before` rule listed ahead of this one formats no semicolon this rule writes, and the same holds of `at-rule-semicolon-space-before` and the one written behind an at-rule. The library lists the block's rule first and its extra rules behind, so every block below names the neighbor and lists this rule as the extra: the order the fix has to answer for, since in the other the neighbor respells whatever this rule wrote; the at-rule blocks keep it for uniformity.
let testRule = createTestRule({ ruleName, extraRules: { [ruleName]: `always` } })

testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always`],

	reject: [
		{
			description: `the block of the issue, whose last semicolon is written behind a line break like the one the neighbor puts in front of the other`,
			code: `
				@media screen{
				a{b:c;d:e}
				}
			`,
			fixed: `
				@media screen{
				a{b:c
				;d:e
				;}
				}
			`,
			warnings: [
				{
					line: 2,
					column: 5,
					message: newlineBeforeMessages.expectedBefore(),
				},
				{
					line: 2,
					column: 9,
					message: messages.expected,
				},
			],
		},
		{
			description: `a declaration carrying a flag, where the break goes into the raw of the flag`,
			code: `a { b: c !important }`,
			fixed: `
				a { b: c !important
				; }
			`,
			line: 1,
			column: 19,
			message: messages.expected,
		},
		{
			description: `a custom property whose value is nothing but whitespace`,
			code: `a { --b: }`,
			fixed: `
				a { --b:
				;}
			`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a comment closing the block behind the declaration, which is a node of its own that the semicolon is written in front of`,
			code: `a { b: c /* x */ }`,
			fixed: `
				a { b: c
				; /* x */ }
			`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a tab in front of the closing brace, which stays behind the written break and semicolon`,
			code: `a { b: c\t}`,
			fixed: `
				a { b: c
				;\t}
			`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a double slash, which plain CSS spells no comment with, so the break and the semicolon are written behind it`,
			code: `a { b: c // x }`,
			fixed: `
				a { b: c // x
				; }
			`,
			line: 1,
			column: 13,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always-multi-line`],

	reject: [
		{
			description: `a block broken over lines, which the option speaks of, so the written semicolon gets its break`,
			code: `
				a {
					b: c;
					d: e
				}
			`,
			fixed: `
				a {
					b: c
				;
					d: e
				;
				}
			`,
			warnings: [
				{
					line: 3,
					column: 5,
					message: messages.expected,
				},
				{
					line: 2,
					column: 5,
					message: newlineBeforeMessages.expectedBeforeMultiLine(),
				},
			],
		},
		{
			description: `a block on one line, which the option is silent about, so the written semicolon is bare like the other`,
			code: `a { b: c; d: e }`,
			fixed: `a { b: c; d: e; }`,
			line: 1,
			column: 14,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: spaceBeforeRuleName,
	config: [`always`],

	reject: [
		{
			description: `the block of the issue, whose last semicolon is written behind a space like the one the neighbor puts in front of the other`,
			code: `
				@media screen{
				a{b:c;d:e}
				}
			`,
			fixed: `
				@media screen{
				a{b:c ;d:e ;}
				}
			`,
			warnings: [
				{
					line: 2,
					column: 5,
					message: spaceBeforeMessages.expectedBefore(),
				},
				{
					line: 2,
					column: 9,
					message: messages.expected,
				},
			],
		},
		{
			description: `a declaration carrying a flag, where the space goes into the raw of the flag`,
			code: `a { b: c !important }`,
			fixed: `a { b: c !important ; }`,
			line: 1,
			column: 19,
			message: messages.expected,
		},
		{
			description: `a custom property whose value is nothing but whitespace, which is the space the option asks for already`,
			code: `a { --b: }`,
			fixed: `a { --b: ;}`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a comment closing the block behind the declaration, which is a node of its own that the semicolon is written in front of`,
			code: `a { b: c /* x */ }`,
			fixed: `a { b: c ; /* x */ }`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a tab in front of the closing brace, which stays behind the written space and semicolon`,
			code: `a { b: c\t}`,
			fixed: `a { b: c ;\t}`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a double slash, which plain CSS spells no comment with, so the space and the semicolon are written behind it where the Less namespace declines`,
			code: `a { b: c // x }`,
			fixed: `a { b: c // x ; }`,
			line: 1,
			column: 13,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: spaceBeforeRuleName,
	config: [`always-single-line`],

	reject: [
		{
			description: `a block on one line, which the option speaks of, so the written semicolon gets its space`,
			code: `a { b: c; d: e }`,
			fixed: `a { b: c ; d: e ; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.expected,
				},
				{
					line: 1,
					column: 8,
					message: spaceBeforeMessages.expectedBeforeSingleLine(),
				},
			],
		},
		{
			description: `a block broken over lines, which the option is silent about, so the written semicolon is bare like the other`,
			code: `
				a {
					b: c;
					d: e
				}
			`,
			fixed: `
				a {
					b: c;
					d: e;
				}
			`,
			line: 3,
			column: 5,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: atRuleSpaceBeforeRuleName,
	config: [`always`],

	reject: [
		{
			description: `a bodiless at-rule closing the block, whose written semicolon gets the space that rule asks for`,
			code: `a { @foo bar }`,
			fixed: `a { @foo bar ; }`,
			line: 1,
			column: 12,
			message: messages.expected,
		},
		{
			description: `a block comment standing between the parameters and the brace, which the space and the semicolon are written behind`,
			code: `a { @foo bar /* c */ }`,
			fixed: `a { @foo bar /* c */ ; }`,
			line: 1,
			column: 20,
			message: messages.expected,
		},
		{
			description: `an at-rule standing behind a declaration, which closes the block in its place`,
			code: `a { b: c; @foo bar }`,
			fixed: `a { b: c; @foo bar ; }`,
			line: 1,
			column: 18,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: atRuleSpaceBeforeRuleName,
	config: [`never`],

	reject: [
		{
			description: `a bodiless at-rule closing the block tight against the brace, whose written semicolon is bare as that rule asks`,
			code: `a { @foo bar}`,
			fixed: `a { @foo bar;}`,
			line: 1,
			column: 12,
			message: messages.expected,
		},
	],
})

// The whitespace in front of the semicolon `never` takes away goes with it, and the neighbors reading that whitespace do not read a semicolon this rule takes out. The two blocks below run the neighbor first, the order in which the run it wrote used to outlive the semicolon, and the third runs this rule first, pinning that both orders rest on one file.
testRule({
	ruleName: spaceBeforeRuleName,
	config: [`always`],
	extraRules: { [ruleName]: `never` },

	reject: [
		{
			description: `a semicolon with no space in front of it where the neighbor asks for one, which the neighbor leaves unread since the strip takes the semicolon out`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2 }`,
			line: 1,
			column: 20,
			endLine: 1,
			endColumn: 21,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always`],
	extraRules: { [ruleName]: `never` },

	reject: [
		{
			description: `the same where the newline neighbor asks for a break, which it leaves unread the same way`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2 }`,
			line: 1,
			column: 20,
			endLine: 1,
			endColumn: 21,
			message: messages.rejected,
		},
	],
})

// The break rule's always and a single-line option of its space twin both speak of a block on a line, and the semicolon this rule writes goes behind the break, which makes the block multi-line and the space rule silent, rather than behind the space, which would leave the break rule asking on the next run
testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always`],
	extraRules: { [ruleName]: `always`, [spaceBeforeRuleName]: `always-single-line` },

	reject: [
		{
			description: `a block on a line whose one declaration has no semicolon, which goes behind a break`,
			code: `a{b:c}`,
			fixed: `a{b:c\n;}`,
			line: 1,
			column: 5,
			endLine: 1,
			endColumn: 6,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always`],
	extraRules: { [ruleName]: `always`, [spaceBeforeRuleName]: `never-single-line` },

	reject: [
		{
			description: `the same block where the space twin forbids the space, which the break rule's ask outranks the same way`,
			code: `a{b:c}`,
			fixed: `a{b:c\n;}`,
			line: 1,
			column: 5,
			endLine: 1,
			endColumn: 6,
			message: messages.expected,
		},
	],
})

testRuleListedFirst({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `always` },

	reject: [
		{
			description: `the same pair the other way round, resting on the same file`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2 }`,
			line: 1,
			column: 20,
			endLine: 1,
			endColumn: 21,
			message: messages.rejected,
		},
	],
})

testRuleListedFirst({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": [`always`, { disableFix: true }] },

	reject: [
		{
			description: `a neighbor whose fix is turned off and no live one speaking, whose ask the written semicolon still honors: the write is this rule's own text, not the turned-off fix`,
			code: `a { b: c }`,
			fixed: `a { b: c ; }`,
			line: 1,
			column: 8,
			endLine: 1,
			endColumn: 9,
			message: messages.expected,
		},
	],
})

/**
 * Fixes one snippet under this rule's `never` and `no-extra-semicolons`, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param thisRuleFirst - Whether this rule is listed first.
 * @returns The file the pass left, the lines this rule reported on in the pass, and the count of the warnings the pair has about the file.
 */
async function fixBesideNoExtra (code: string, thisRuleFirst: boolean): Promise<{ code: string, reported: number[], left: number }> {
	let pair: [string, unknown][] = [[ruleName, `never`], [`@stylistic/no-extra-semicolons`, true]]
	let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
	let fixed = await stylelint.lint({ code, config, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config })

	return { code: fixed.code ?? code, reported: (fixed.results[0]?.warnings ?? []).filter((warning) => warning.rule === ruleName).map((warning) => warning.line), left: read.results[0]?.warnings.length ?? 0 }
}

describe(`the semicolons behind the node closing a block beside \`no-extra-semicolons\``, () => {
	// A free semicolon that rule takes out is passed over, so the warning and the disable comment read on its line stand on a semicolon that stays whichever side of that rule this one is listed
	it.each([true, false])(`are taken where a disable comment covers only a free one the neighbor takes, this rule listed first: %s`, async (thisRuleFirst) => {
		let code = `a {\n\tb: c;\n\t/* stylelint-disable-next-line ${ruleName} */\n;\n}`

		expect(await fixBesideNoExtra(code, thisRuleFirst)).toEqual({ code: `a {\n\tb: c\n\t/* stylelint-disable-next-line ${ruleName} */\n\n}`, reported: [], left: 0 })
	})

	it.each([true, false])(`are kept where a disable comment covers the declaration's own, this rule listed first: %s`, async (thisRuleFirst) => {
		let code = `a {\n\tb: c; /* stylelint-disable-line ${ruleName} */\n\t;\n}`

		expect(await fixBesideNoExtra(code, thisRuleFirst)).toEqual({ code: `a {\n\tb: c; /* stylelint-disable-line ${ruleName} */\n\t\n}`, reported: [], left: 0 })
	})

	it(`are all taken where that rule keeps the free one`, async () => {
		let code = `a {\n\tb: c;\n\t; /* stylelint-disable-line @stylistic/no-extra-semicolons */\n}`

		expect(await fixBesideNoExtra(code, true)).toEqual({ code: `a {\n\tb: c\n\t /* stylelint-disable-line @stylistic/no-extra-semicolons */\n}`, reported: [], left: 0 })
	})
})

describe(`the semicolons behind the node closing a block with no \`no-extra-semicolons\` beside`, () => {
	it(`are reported on the last one, whose line a disable comment covers`, async () => {
		let code = `a {\n\tb: c;\n\t; /* stylelint-disable-line ${ruleName} */\n}`
		let config = { plugins, rules: { [ruleName]: `never` } }
		let fixed = await stylelint.lint({ code, config, fix: true })

		expect(fixed.code).toBe(code)
	})
})

/**
 * Fixes one snippet under a namespace's copy of this rule at `never` and reads the warnings the pass left.
 * @param code - The snippet.
 * @param namespace - The namespace, which names the custom syntax too.
 * @returns The file the pass left and where the warnings it left stand.
 */
async function fixUnder (code: string, namespace: `scss` | `less`): Promise<{ code: string, left: string[] }> {
	let config = { plugins, rules: { [`@stylistic/${namespace}/declaration-block-trailing-semicolon`]: `never` } }
	let fixed = await stylelint.lint({ code, config, fix: true, customSyntax: `postcss-${namespace}` })

	return { code: fixed.code ?? code, left: (fixed.results[0]?.warnings ?? []).map(({ line, column }) => `${line}:${column}`) }
}

describe(`the semicolon behind a custom property or a bodiless at-rule a comment follows, under a preprocessor`, () => {
	// Sass and Less were asked with the semicolon and without it: where the output parts, the language requires the semicolon, and the warning stands over code the fix leaves alone
	it.each([
		[`a {\n\t--x: 1; // c\n}\n`, `scss`, `a {\n\t--x: 1; // c\n}\n`, [`2:8`]],
		[`a {\n\t--x: 1; /* c */\n}\n`, `scss`, `a {\n\t--x: 1; /* c */\n}\n`, [`2:8`]],
		[`a {\n\t@include m; /* c */\n}\n`, `scss`, `a {\n\t@include m; /* c */\n}\n`, [`2:12`]],
		[`a {\n\t@include m; // c\n}\n`, `scss`, `a {\n\t@include m // c\n}\n`, []],
		[`a {\n\t--x: 1; // c\n}\n`, `less`, `a {\n\t--x: 1; // c\n}\n`, [`2:8`]],
		[`a {\n\t--x: 1 !important; // c\n}\n`, `less`, `a {\n\t--x: 1 !important; // c\n}\n`, [`2:19`]],
		[`a {\n\t--x: 1; /* c */\n}\n`, `less`, `a {\n\t--x: 1 /* c */\n}\n`, []],
		[`a {\n\t.m(); // c\n}\n`, `less`, `a {\n\t.m(); // c\n}\n`, [`2:6`]],
		[`a {\n\t.m(); /* c */\n}\n`, `less`, `a {\n\t.m() /* c */\n}\n`, []],
		[`a {\n\t@v: 1; // c\n}\n`, `less`, `a {\n\t@v: 1; // c\n}\n`, [`2:7`]],
	] as const)(`in %j under %s`, async (code, namespace, output, left) => {
		expect(await fixUnder(code, namespace)).toEqual({ code: output, left })
	})
})
