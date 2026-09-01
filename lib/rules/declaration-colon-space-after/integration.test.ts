import { messages as declarationBlockSemicolonNewlineBeforeMessages } from "../declaration-block-semicolon-newline-before/index.ts"
import { messages as declarationBlockSemicolonSpaceBeforeMessages } from "../declaration-block-semicolon-space-before/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always-single-line`],
	extraRules: {
		"@stylistic/declaration-block-semicolon-newline-before": `never-multi-line`,
		"@stylistic/declaration-block-semicolon-space-before": `never`,
	},

	accept: [
		{
			description: `a block where a multi-line value, an empty custom property and a plain declaration stand together, each spaced as the option asks`,
			code: `
				a {
					gap:
						0
						2em;
					--foo: ;
					color: red;
					--bar: ;
				}`,
		},
	],

	reject: [
		{
			description: `the same block with the spacing wrong in every one of the three, so that the fixes are written to one value after another`,
			code: `
				a {
					color:red ;
					gap:
						0
						2em
					;
					--foo: ;
					--bar:;
					--baz:          ;
				}`,
			fixed: `
				a {
					color: red;
					gap:
						0
						2em;
					--foo: ;
					--bar: ;
					--baz: ;
				}`,
			warnings: [
				{
					line: 2,
					column: 8,
					endLine: 2,
					endColumn: 9,
					message: messages.expectedAfterSingleLine(),
				},
				{
					line: 8,
					column: 8,
					endLine: 8,
					endColumn: 9,
					message: messages.expectedAfterSingleLine(),
				},
				{
					line: 9,
					column: 8,
					endLine: 9,
					endColumn: 9,
					message: messages.expectedAfterSingleLine(),
				},
				{
					line: 2,
					column: 11,
					endLine: 2,
					endColumn: 12,
					message: declarationBlockSemicolonNewlineBeforeMessages.rejectedBeforeMultiLine(),
				},
				{
					line: 6,
					column: 1,
					endLine: 6,
					endColumn: 2,
					message: declarationBlockSemicolonNewlineBeforeMessages.rejectedBeforeMultiLine(),
				},
				{
					line: 9,
					column: 17,
					endLine: 9,
					endColumn: 18,
					message: declarationBlockSemicolonNewlineBeforeMessages.rejectedBeforeMultiLine(),
				},
				{
					line: 2,
					column: 11,
					endLine: 2,
					endColumn: 12,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
				{
					line: 6,
					column: 1,
					endLine: 6,
					endColumn: 2,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
				{
					line: 9,
					column: 17,
					endLine: 9,
					endColumn: 18,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `never` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `a value that holds no word of its own: the run behind the colon is taken away, and the one in front of the semicolon is left where the parser filed it, so that the rule asked about that one reaches it still`,
			code: `a { color:  /*comment*/ ; }`,
			fixed: `a { color:/*comment*/; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 24,
					endLine: 1,
					endColumn: 25,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
			],
		},
	],
})

// Where a declaration's value is nothing but whitespace, the run this rule reads behind the colon is the run the `declaration-block-semicolon-*-before` rules read in front of the semicolon (#416). The library lists the rule a block names first and its extra rules behind it, so every block below has the neighbour run last: that is the order in which the neighbour used to be blind to what this rule wrote, and the two took the run in turns.
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `never` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416
			description: `a value that is nothing at all, which the neighbour asks to stay nothing and this rule asks to open with a space: the neighbour is listed last and has the last word, so the space is not written and the warning stands`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `a custom property whose value is nothing at all, where the neighbour leaves a single space alone and the space is written`,
			code: `a { --a:; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 10,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `never-single-line` },

	reject: [
		{
			description: `the same pair under the single-line options, over a block on one line`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `always` },

	reject: [
		{
			description: `a value that is nothing but a space, which the neighbour asks to stay in front of the semicolon and this rule asks to take away`,
			code: `a { color: ; }`,
			fixed: `a { color: ; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `always` },

	reject: [
		{
			description: `a neighbour asking for the same single space, which is written once and answers both`,
			code: `a { color:; }`,
			fixed: `a { color: ; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: declarationBlockSemicolonSpaceBeforeMessages.expectedBefore(),
				},
			],
		},
	],
})
