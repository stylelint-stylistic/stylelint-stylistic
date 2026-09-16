import { createRule } from "../../../../rules/value-slash-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an inline comment behind the solidus, closed by the newline the option asks for`,
			code: `a { b: 1 / // c\n2; }`,
		},
	],

	reject: [
		{
			// The tokenizer takes the address whole, and the reading closes it at the parenthesis of `a(b)`
			description: `a solidus behind an address holding nested parentheses and an inline comment that holds a solidus of its own`,
			code: `a { b: url(a(b) // ) / c\n) / 1px; }`,
			fixed: `a { b: url(a(b) // ) / c\n) /\n 1px; }`,
			line: 2,
			column: 3,
			message: messages.expectedAfter(),
		},
		{
			// The same text, where another inline comment makes the syntax keep a copy of the value
			description: `the same address in a value holding another inline comment`,
			code: `a { b: 1px // x\n  url(a(b) // ) / c\n) / 1px; }`,
			fixed: `a { b: 1px // x\n  url(a(b) // ) / c\n) /\n 1px; }`,
			line: 3,
			column: 3,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a newline behind the solidus with an inline comment on the next line, which the fixer has to leave standing: closed up, the solidus would open the comment`,
			code: `a { b: 1 /\n// c\n2; }`,
			fixed: `a { b: 1 /\n// c\n2; }`,
			line: 1,
			column: 10,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})
