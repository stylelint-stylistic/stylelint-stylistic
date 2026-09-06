import { createRule } from "../../../../rules/value-slash-newline-after/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `an inline comment behind the solidus, closed by the newline the option asks for`,
			code: `a { b: 1 / // c\n2; }`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

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
