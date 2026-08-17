import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@media (max-width: 600px) {}`,
		},
		{
			code: `@mEdIa (max-width: 600px) {}`,
		},
		{
			code: `@MEDIA (max-width: 600px) {}`,
		},
		{
			code: `@media (max-width : 600px) {}`,
		},
		{
			code: `@media (max-width: 600px) and (min-width: 3em) {}`,
		},
		{
			code: `@custom-selector :--enter :hover;`,
		},
	],

	reject: [
		{
			code: `@media (max-width:600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@mEdIa (max-width:600px) {}`,
			fixed: `@mEdIa (max-width: 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@MEDIA (max-width:600px) {}`,
			fixed: `@MEDIA (max-width: 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:  600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:\t600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:\n600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:\r\n600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			description: `CRLF`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:600px) and (min-width: 3em) {}`,
			fixed: `@media (max-width: 600px) and (min-width: 3em) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width: 600px) and (min-width:3em) {}`,
			fixed: `@media (max-width: 600px) and (min-width: 3em) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 41,
		},
		{
			code: `@media (max-width:600px) and (min-width:3em) {}`,
			fixed: `@media (max-width: 600px) and (min-width: 3em) {}`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 18,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 40,
				},
			],
		},
		{
			code: `@media(p:600px) and (prop:600px) {}`,
			fixed: `@media(p: 600px) and (prop: 600px) {}`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 9,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 26,
				},
			],
		},
		{
			code: `@media (max-width:/*comment*/600px) {}`,
			fixed: `@media (max-width: /*comment*/600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `@media (max-width:600px) {}`,
		},
		{
			code: `@mEdIa (max-width:600px) {}`,
		},
		{
			code: `@MEDIA (max-width:600px) {}`,
		},
		{
			code: `@media (max-width:600px) and (min-width:3em) {}`,
		},
		{
			code: `@custom-selector : --enter :hover;`,
		},
	],

	reject: [
		{
			code: `@media (max-width: 600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@mEdIa (max-width: 600px) {}`,
			fixed: `@mEdIa (max-width:600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@MEDIA (max-width: 600px) {}`,
			fixed: `@MEDIA (max-width:600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:  600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:\t600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:\n600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:\r\n600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			description: `CRLF`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width:600px) and (min-width: 3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 40,
		},
		{
			code: `@media (max-width: 600px) and (min-width:3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width: 600px) and (min-width: 3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			warnings: [
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 18,
				},
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 41,
				},
			],
		},
		{
			code: `@media (max-width: /*comment*/ 600px) {}`,
			fixed: `@media (max-width:/*comment*/ 600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,
	autoStripIndent: true,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/115
			description: `the fix reaches the copy of the parameters this syntax prints, and the inline comment keeps its spelling`,
			code: `
				@media (min-width:1px) and // c
				(max-width:2px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 1px) and // c
				(max-width: 2px) { a { color: red; } }
			`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 18,
				},
				{
					message: messages.expectedAfter(),
					line: 2,
					column: 11,
				},
			],
		},
	],
})
