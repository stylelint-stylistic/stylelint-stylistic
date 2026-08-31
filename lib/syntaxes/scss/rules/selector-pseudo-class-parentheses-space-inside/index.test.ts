import { createRule } from "../../../../rules/selector-pseudo-class-parentheses-space-inside/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an inline comment closing the arguments, whose line break is the whitespace in front of the parenthesis`,
			code: `a:not( // c\n) { }`,
		},
		{
			description: `the same, the comment folded into the raws of the node in front of it`,
			code: `a:not( b // c\n) { }`,
		},
	],

	reject: [
		{
			description: `the opening of a pseudo-class whose arguments an inline comment closes, which is asked about on its own`,
			code: `a:not(// c\n) { }`,
			fixed: `a:not( // c\n) { }`,
			line: 1,
			column: 7,
			message: messages.expectedOpening,
		},
		{
			description: `a selector carrying an inline comment, whose positions the source spells two characters short of the raw`,
			code: `a:not(b, // c\n d) { }`,
			fixed: `a:not( b, // c\n d ) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 2,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `a block comment under this syntax is read as it is under any other`,
			code: `a:not(/* c */) { }`,
			fixed: `a:not( /* c */ ) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedClosing,
				},
			],
		},
	],
})
