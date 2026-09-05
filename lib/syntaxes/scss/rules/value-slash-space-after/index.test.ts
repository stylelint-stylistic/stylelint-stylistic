import { createRule } from "../../../../rules/value-slash-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a solidus beside a variable, which Sass divides at`,
			code: `a { b: 4/$a; }`,
		},
		{
			description: `a solidus beside a call, which Sass divides at`,
			code: `a { b: fn()/2; }`,
		},
		{
			description: `a solidus in front of an inline comment, with a space between them`,
			code: `a { b: 1 / // c\n 2; }`,
		},
	],

	reject: [
		{
			description: `a solidus beside a call Sass hands through as plain CSS, which keeps the separator`,
			code: `a { b: var(--x)/2; }`,
			fixed: `a { b: var(--x)/ 2; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a solidus beside a variable, which Sass divides at`,
			code: `a { b: 4 / $a; }`,
		},
	],

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
