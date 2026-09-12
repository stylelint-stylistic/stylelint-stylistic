import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"
import { ruleName as atRuleSpaceBeforeRuleName } from "../at-rule-semicolon-space-before/index.ts"
import { messages as newlineBeforeMessages, ruleName as newlineBeforeRuleName } from "../declaration-block-semicolon-newline-before/index.ts"
import { messages as spaceBeforeMessages, ruleName as spaceBeforeRuleName } from "../declaration-block-semicolon-space-before/index.ts"

import { messages, ruleName } from "./index.ts"

let testRuleListedFirst = createTestRule({ ruleName })

// A `declaration-block-semicolon-*-before` rule listed ahead of this one formats no semicolon this rule writes (#354), and the same holds of `at-rule-semicolon-space-before` and the one written behind an at-rule (#477). The library lists the block's rule first and its extra rules behind, so every block below names the neighbour and lists this rule as the extra: the order the fix has to answer for, since in the other the neighbour respells whatever this rule wrote; the at-rule blocks keep it for uniformity.
let testRule = createTestRule({ ruleName, extraRules: { [ruleName]: `always` } })

testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always`],

	reject: [
		{
			// See #354
			description: `the block of the issue, whose last semicolon is written behind a line break like the one the neighbour puts in front of the other`,
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
			// See #354
			description: `the block of the issue, whose last semicolon is written behind a space like the one the neighbour puts in front of the other`,
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
			// See #477
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

// The whitespace in front of the semicolon `never` takes away goes with it (#479). The two blocks below run the neighbour first, the order in which the run it wrote used to outlive the semicolon, and the third runs this rule first, pinning that both orders rest on one file.
testRule({
	ruleName: spaceBeforeRuleName,
	config: [`always`],
	extraRules: { [ruleName]: `never` },

	reject: [
		{
			// See #479
			description: `the space the neighbour writes in front of the semicolon, which the strip takes along instead of leaving it in front of the brace`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2 }`,
			warnings: [
				{
					line: 1,
					column: 19,
					endLine: 1,
					endColumn: 20,
					message: spaceBeforeMessages.expectedBefore(),
				},
				{
					line: 1,
					column: 20,
					endLine: 1,
					endColumn: 21,
					message: messages.rejected,
				},
			],
		},
	],
})

testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always`],
	extraRules: { [ruleName]: `never` },

	reject: [
		{
			description: `the break the newline neighbour writes there, which goes the same way`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2 }`,
			warnings: [
				{
					line: 1,
					column: 19,
					endLine: 1,
					endColumn: 20,
					message: newlineBeforeMessages.expectedBefore(),
				},
				{
					line: 1,
					column: 20,
					endLine: 1,
					endColumn: 21,
					message: messages.rejected,
				},
			],
		},
	],
})

testRuleListedFirst({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `always` },

	reject: [
		{
			description: `the same pair the other way round, resting on the same file: the semicolon goes first, and the run the neighbour asked for goes unwritten with it`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2 }`,
			warnings: [
				{
					line: 1,
					column: 20,
					endLine: 1,
					endColumn: 21,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 19,
					endLine: 1,
					endColumn: 20,
					message: spaceBeforeMessages.expectedBefore(),
				},
			],
		},
	],
})

testRuleListedFirst({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": [`always`, { disableFix: true }] },

	reject: [
		{
			// See #485
			description: `a neighbour whose fix is turned off and no live one speaking, whose ask the written semicolon still honours: the write is this rule's own text, not the turned-off fix`,
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

// The rule under two namespaces is the only pair that writes the block's semicolon flag and then reads it, and only the fixing run holds that state, so the file and the warning are asserted directly rather than through a case. Every spelling of the run reports the at-rule's last character, as a declaration does, since the always fix moves that run out of the at-rule's raw and into the block's (#630).
describe(`a bodiless at-rule the parser hands over with no source end`, () => {
	it.each([
		[`no run at all in front of the closing brace`, `a { @content}`, `a { @content;}`, 1, 12],
		[`a single space there`, `a { @content }`, `a { @content; }`, 1, 12],
		[`three spaces there`, `a { @content   }`, `a { @content;   }`, 1, 12],
		[`a line break there`, `a {\n\t@content\n}\n`, `a {\n\t@content;\n}\n`, 2, 9],
	])(`carries the warning of a never listed behind an always with %s`, async (_run, code, written, line, column) => {
		let rules = { [ruleName]: `always`, "@stylistic/less/declaration-block-trailing-semicolon": [`never`, { disableFix: true }] }
		let result = await stylelint.lint({ code, config: { plugins, rules }, fix: true })

		expect(result.code).toBe(written)
		expect(result.results[0]?.warnings.map((warning) => ({ line: warning.line, column: warning.column, endColumn: warning.endColumn }))).toEqual([{ line, column, endColumn: column + 1 }])
	})

	it(`reports the same character where the space rule of at-rules has put a run back into the raw the always fix emptied`, async () => {
		let rules = { [atRuleSpaceBeforeRuleName]: `always`, [ruleName]: `always`, "@stylistic/less/declaration-block-trailing-semicolon": [`never`, { disableFix: true }] }
		let result = await stylelint.lint({ code: `a { @content   }`, config: { plugins, rules }, fix: true })

		expect(result.code).toBe(`a { @content ;   }`)
		expect(result.results[0]?.warnings.map((warning) => ({ line: warning.line, column: warning.column, endColumn: warning.endColumn }))).toEqual([{ line: 1, column: 12, endColumn: 13 }])
	})
})
