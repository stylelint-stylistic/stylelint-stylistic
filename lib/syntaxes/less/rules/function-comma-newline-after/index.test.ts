import { createRule } from "../../../../rules/function-comma-newline-after/index.ts"
import { less } from "../../index.ts"

let { messages, ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a comma inside the text of an inline comment is asked for no line break of its own`,
			code: `
				a { t: translate(1px,
				  2px // a, b
				  ); }
			`,
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px,2px // a, b\n  ); }`,
		},
	],
})

// The run behind the comma is the one in front of the comment, not the break that closes the comment's line
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a single space behind the comma and an end-of-line comment behind the space`,
			code: `a {\n\tb: f(1, // c\n\t\t2);\n}\n`,
			fixed: `a {\n\tb: f(1,// c\n\t\t2);\n}\n`,
			line: 2,
			column: 8,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})
