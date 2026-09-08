import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"
import { messages as braceNewlineAfterMessages } from "../block-opening-brace-newline-after/index.ts"
import { messages as braceSpaceAfterMessages } from "../block-opening-brace-space-after/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

// The library lists the block's rule first and its extra rule behind it: the order in which an undeferred check would have reported a block the neighbour was about to break over two lines
testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-opening-brace-newline-after": `always` },

	reject: [
		{
			description: `a single-line block holding two declarations, reported behind the neighbour in the check and not at all in the fixing run, where the neighbour has broken the block over two lines before the rule reads it`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a {
				 color: pink; top: 0; }
			`,
			warnings: [
				{
					line: 1,
					column: 4,
					endLine: 1,
					endColumn: 5,
					message: braceNewlineAfterMessages.expectedAfter(),
				},
				{
					line: 1,
					column: 3,
					endLine: 1,
					endColumn: 27,
					message: messages.expected(1),
				},
			],
		},
	],
})

// The fix spells each run as the rules about it ask (#641). The rule's check is deferred behind every lineness-conditioned neighbour and its write lands behind every `always` and `never` one, wherever the configuration lists them, so the order the library fixes is the only order there is; a probe over both confirmed it
testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-opening-brace-newline-after": `never-multi-line` },

	reject: [
		{
			description: `a single-line block holding two declarations, broken everywhere but behind the opening brace, where the neighbour refuses whitespace in a multi-line block`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a {color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-opening-brace-newline-after": [`never-multi-line`, { disableFix: true }] },

	reject: [
		{
			description: `the same block beside the same neighbour with its fix turned off, which still says what it wants behind the brace`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a {color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-opening-brace-space-after": `always` },

	reject: [
		{
			description: `the same block where the neighbour asks for a single space behind the opening brace, which the fix keeps`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a { color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-opening-brace-space-after": `never` },

	reject: [
		{
			description: `a block spelled without whitespace behind the opening brace, which the neighbour refuses there and the fix leaves out`,
			code: `a {color: pink; top: 0; }`,
			fixed: `
				a {color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 26,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-after": `never-multi-line` },

	reject: [
		{
			description: `the block where the neighbour refuses whitespace behind a semicolon in a multi-line block, so the two declarations share a line`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a {
				color: pink;top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-after": `always-multi-line` },

	reject: [
		{
			description: `a comment behind the semicolon beside the neighbour asking for a break behind it in a multi-line block, which reads past the comment, so the comment keeps its run and the break goes behind it`,
			code: `a { color: pink; /* c */ top: 0; }`,
			fixed: `
				a {
				color: pink; /* c */
				top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 35,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/declaration-block-semicolon-space-after": `always` },

	reject: [
		{
			description: `the block where the neighbour asks for a single space behind a semicolon, which the fix keeps`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a {
				color: pink; top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/declaration-block-semicolon-space-after": `never` },

	reject: [
		{
			description: `a block spelled without whitespace behind the semicolon, which the neighbour refuses there and the fix leaves out`,
			code: `a { color: pink;top: 0; }`,
			fixed: `
				a {
				color: pink;top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 26,
			message: messages.expected(1),
		},
		{
			description: `a comment behind the semicolon, whose run the neighbour reads and the fix spells as it asks, the break going behind the comment`,
			code: `a { color: pink;/* c */ top: 0; }`,
			fixed: `
				a {
				color: pink;/* c */
				top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 34,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-closing-brace-newline-before": `never-multi-line` },

	reject: [
		{
			description: `the block where the neighbour refuses whitespace in front of the closing brace of a multi-line block`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a {
				color: pink;
				top: 0;}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-closing-brace-space-before": `always` },

	reject: [
		{
			description: `the block where the neighbour asks for a single space in front of the closing brace, which the fix keeps`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a {
				color: pink;
				top: 0; }
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-closing-brace-space-before": `never` },

	reject: [
		{
			description: `a block spelled without whitespace in front of the closing brace, which the neighbour refuses there and the fix leaves out`,
			code: `a { color: pink; top: 0;}`,
			fixed: `
				a {
				color: pink;
				top: 0;}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 26,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-closing-brace-newline-after": `never-single-line` },

	reject: [
		{
			description: `a nested single-line block in front of the two declarations, behind whose closing brace the neighbour refuses whitespace, asked about that block's lineness rather than the broken one's`,
			code: `a { & b { x: 1; }color: pink; top: 0; }`,
			fixed: `
				a {
				& b { x: 1; }color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 40,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-closing-brace-newline-after": `never-multi-line` },

	reject: [
		{
			description: `the same nested block beside the neighbour's multi-line option, which is silent about a single-line block, so the run behind its brace gets the break`,
			code: `a { & b { x: 1; } color: pink; top: 0; }`,
			fixed: `
				a {
				& b { x: 1; }
				color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 41,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-closing-brace-space-after": `always` },

	reject: [
		{
			description: `the same nested block where the neighbour asks for a single space behind its closing brace, which the fix keeps`,
			code: `a { & b { x: 1; } color: pink; top: 0; }`,
			fixed: `
				a {
				& b { x: 1; } color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 41,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: {
		"@stylistic/block-opening-brace-newline-after": `never-multi-line`,
		"@stylistic/declaration-block-semicolon-newline-after": `never-multi-line`,
		"@stylistic/block-closing-brace-newline-before": `never-multi-line`,
	},

	reject: [
		{
			description: `the block beside the three rules refusing whitespace in a multi-line block, which the fix leaves as it is, since no run would get a break and the block would stay on one line`,
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: {
		"@stylistic/block-opening-brace-space-after": `always`,
		"@stylistic/declaration-block-semicolon-space-after": `always`,
		"@stylistic/block-closing-brace-space-before": `always`,
	},

	reject: [
		{
			description: `the block beside the three rules asking for a single space in every run, which the fix leaves as it is for the same reason`,
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

// `indentation` checks behind this rule in the same run, so the lines the fix writes get their indent at once (#353)
testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/indentation": `tab` },

	reject: [
		{
			description: `the block beside the indentation rule, whose lines come out indented in the one run`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a {
					color: pink;
					top: 0;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: {
		"@stylistic/block-opening-brace-newline-after": `always-multi-line`,
		"@stylistic/declaration-block-semicolon-newline-after": `always-multi-line`,
		"@stylistic/block-closing-brace-newline-before": `always-multi-line`,
		"@stylistic/indentation": `tab`,
	},

	reject: [
		{
			description: `a block nested in an at-rule beside the three rules asking for those very breaks in a multi-line block and the indentation rule, which come out with nothing left for a second run`,
			code: `
				@media (x) {
					a { color: pink; top: 0; }
				}
			`,
			fixed: `
				@media (x) {
					a {
						color: pink;
						top: 0;
					}
				}
			`,
			line: 2,
			column: 4,
			endLine: 2,
			endColumn: 28,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/linebreaks": `windows` },

	reject: [
		{
			autoStripIndent: false,
			description: `a one-line file beside the linebreaks rule asking for Windows breaks, which the fix writes`,
			code: `a { color: pink; top: 0; }`,
			fixed: `a {\r\ncolor: pink;\r\ntop: 0;\r\n}`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(1),
		},
	],
})

describe(`the check behind the writers of the run`, () => {
	it(`reports the block three never-multi-line rules leave on one line, which was multi-line as parsed`, async () => {
		let { code, results } = await stylelint.lint({
			code: `a {\n\tcolor: pink;\n\ttop: 0;\n}\n`,
			config: {
				plugins,
				rules: {
					[ruleName]: 1,
					"@stylistic/block-opening-brace-newline-after": `never-multi-line`,
					"@stylistic/declaration-block-semicolon-newline-after": `never-multi-line`,
					"@stylistic/block-closing-brace-newline-before": `never-multi-line`,
				},
			},
			fix: true,
		})

		expect(code).toBe(`a {color: pink;top: 0;}\n`)
		expect(results[0]?.warnings.map(({ rule, line, column }) => ({ rule, line, column }))).toEqual([{ rule: ruleName, line: 1, column: 3 }])
	})
})

describe(`two rules speaking of one run`, () => {
	// The pair contradicts each other over any multi-line block, so the relint the library runs over the fixed file would report the loser; the outcome is asserted directly instead
	let newlineRule = `@stylistic/block-opening-brace-newline-after`
	let spaceRule = `@stylistic/block-opening-brace-space-after`

	it.each([
		[`the space rule listed first`, { [ruleName]: 1, [spaceRule]: `always`, [newlineRule]: `always-multi-line` }],
		[`the newline rule listed first`, { [ruleName]: 1, [newlineRule]: `always-multi-line`, [spaceRule]: `always` }],
	])(`writes what the one writing last asks, which is the deferred newline rule with %s, since the space rule's always has written before either`, async (_listing, rules) => {
		let written = `a {\ncolor: pink;\ntop: 0;\n}\n`
		let { code, results } = await stylelint.lint({ code: `a { color: pink; top: 0; }\n`, config: { plugins, rules }, fix: true })

		expect(code).toBe(written)
		expect(results[0]?.warnings).toEqual([])

		let relint = await stylelint.lint({ code: written, config: { plugins, rules } })

		expect(relint.results[0]?.warnings.map(({ rule, text }) => ({ rule, text }))).toEqual([{ rule: spaceRule, text: braceSpaceAfterMessages.expectedAfter() }])
	})
})

describe(`the run in front of a comment`, () => {
	// The neighbour reports and, its fix turned off, writes nothing, so the library's relint of the fixed file would disagree with the fixing run about that warning; the file is asserted directly
	it(`is written as a space rule with its fix turned off asks, so the fixed file satisfies it`, async () => {
		let rules = { [ruleName]: 1, "@stylistic/declaration-block-semicolon-space-after": [`never`, { disableFix: true }] }
		let written = `a {\ncolor: pink;/* c */\ntop: 0;\n}\n`
		let { code } = await stylelint.lint({ code: `a { color: pink; /* c */ top: 0; }\n`, config: { plugins, rules }, fix: true })

		expect(code).toBe(written)

		let relint = await stylelint.lint({ code: written, config: { plugins, rules } })

		expect(relint.results[0]?.warnings).toEqual([])
	})
})
