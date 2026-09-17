import { createRule } from "../../../../rules/value-slash-space-after/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a value opening with a variable, which is passed over whole`,
			code: `a { b: @a/2; }`,
		},
		{
			description: `a parenthesised group, inside which Less divides`,
			code: `a { b: (4/2); }`,
		},
	],

	reject: [
		{
			description: `a solidus in front of a variable, which Less keeps as the separator under its default math mode`,
			code: `a { b: 2/@a; }`,
			fixed: `a { b: 2/ @a; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of a separator solidus behind a star as text of the name's word, which no comment ends there
			description: `a solidus behind a star glued to the name of a bare address holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1 */url(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1 */url(a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a space between the solidus and an inline comment, which the fixer has to leave standing: closed up, the solidus would open the comment`,
			code: `a { b: 1 / // c\n 2; }`,
			fixed: `a { b: 1 / // c\n 2; }`,
			line: 1,
			column: 10,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space between the solidus and a block comment, which the fixer has to leave standing for the same reason`,
			code: `a { b: 1 / /*c*/ 2; }`,
			fixed: `a { b: 1 / /*c*/ 2; }`,
			line: 1,
			column: 10,
			message: messages.rejectedAfter(),
		},
	],
})
