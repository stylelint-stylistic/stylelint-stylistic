import { messages as semicolonNewlineBeforeMessages } from "../declaration-block-semicolon-newline-before/index.ts"
import { messages as colonSpaceAfterMessages } from "../declaration-colon-space-after/index.ts"

import { messages, ruleName } from "./index.ts"

// Where a declaration's value is nothing but whitespace, the run this rule reads behind the colon is the run the `declaration-block-semicolon-*-before` rules read in front of the semicolon (#416). The library lists the rule a block names first and its extra rules behind it, so every block below has the neighbour run last: that is the order in which the neighbour used to be blind to what this rule wrote, and the two took the run in turns.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416
			description: `a value that is nothing but a space, which the neighbour asks to stand in front of the semicolon and this rule asks to stand behind a break: the neighbour is listed last and has the last word, so the break is not written and the warning stands`,
			code: `a { color: ; }`,
			fixed: `a { color: ; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment on the colon's line, behind which the run this rule reads is the run in front of the semicolon as well`,
			code: `a { color: /*c*/ ; }`,
			fixed: `a { color: /*c*/ ; }`,
			line: 1,
			column: 16,
			endLine: 1,
			endColumn: 17,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `never` },

	reject: [
		{
			description: `a value that is nothing at all, which the neighbour asks to stay nothing`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-before": `never-multi-line` },

	reject: [
		{
			description: `a block on one line, which the neighbour is silent about as it stands and speaks of the moment this rule's break puts it over two`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a block over several lines, where the second declaration has a word of its own and takes its break as it always did`,
			code: `
				a {
					color:;
					top: 0;
				}
			`,
			fixed: `
				a {
					color:;
					top:
				 0;
				}
			`,
			warnings: [
				{
					line: 2,
					column: 7,
					endLine: 2,
					endColumn: 8,
					message: messages.expectedAfter(),
				},
				{
					line: 3,
					column: 5,
					endLine: 3,
					endColumn: 6,
					message: messages.expectedAfter(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-space-after": `always-single-line` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/484
			description: `a custom property whose single space the other colon rule asks for: the break this rule writes would stand in the raw between until the next parse, so that rule still reads the value as one line and would fold the break away, and the break is not written`,
			code: `a { --a: ; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 8,
			endLine: 1,
			endColumn: 9,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-before": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/417
			description: `a neighbour asking for a break of its own, which the one this rule writes answers as well: the run is written down to the bare break the neighbour's fix spells, so both orders rest on one file`,
			code: `a { color: ; }`,
			fixed: `a { color:\n; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
		{
			description: `a comment on the colon's line, behind which the shared run and its tail stand`,
			code: `a { color:  /*c*/ ; }`,
			fixed: `a { color:  /*c*/\n; }`,
			warnings: [
				{
					line: 1,
					column: 17,
					endLine: 1,
					endColumn: 18,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 18,
					endLine: 1,
					endColumn: 19,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
		{
			description: `a run spelled with a tab, which does not survive the break either`,
			code: `a { color:\t; }`,
			fixed: `a { color:\n; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
		{
			description: `a custom property, whose run is written down to the break like any other`,
			code: `a { --a: ; }`,
			fixed: `a { --a:\n; }`,
			warnings: [
				{
					line: 1,
					column: 8,
					endLine: 1,
					endColumn: 9,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 10,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
	],
})

// The two colon rules read one and the same run behind the colon of every declaration, and settle between them who writes it (#484). The library lists the rule a block names first and its extra rules behind it, so the block below runs this rule first — the order in which its blind break used to grow the file — and the SCSS spelling of the shape stands in that namespace's own file.
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-space-after": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/484
			description: `a value that is a flag behind its run, over which the file used to grow by a space on every run of the fixer: the space rule is listed last and has the last word, so the break is not written and the warning stands`,
			code: `a { color: !important ; }`,
			fixed: `a { color: !important ; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a value carrying a word behind two spaces, where the space rule listed last writes the run down to its one space`,
			code: `a { color:  red; }`,
			fixed: `a { color: red; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: colonSpaceAfterMessages.expectedAfter(),
				},
			],
		},
	],
})
