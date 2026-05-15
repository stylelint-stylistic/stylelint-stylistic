import { messages as declarationBlockSemicolonNewlineBeforeMessages } from "../declaration-block-semicolon-newline-before/index.js"
import { messages as declarationBlockSemicolonSpaceBeforeMessages } from "../declaration-block-semicolon-space-before/index.js"

import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always-single-line`],
	extraRules: {
		"@stylistic/declaration-block-semicolon-newline-before": `never-multi-line`,
		"@stylistic/declaration-block-semicolon-space-before": `never`,
	},

	accept: [
		{
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
