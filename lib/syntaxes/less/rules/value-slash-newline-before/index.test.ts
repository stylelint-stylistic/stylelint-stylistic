import { createRule } from "../../../../rules/value-slash-newline-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `an inline comment in front of the solidus, whose closing newline is the one the option asks for`,
			code: `a { b: 1 // c\n/ 2; }`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `an inline comment closed by the newline in front of the solidus, which the fixer has to leave standing`,
			code: `a { b: 1 // c\n/ 2; }`,
			fixed: `a { b: 1 // c\n/ 2; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
