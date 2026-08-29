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
