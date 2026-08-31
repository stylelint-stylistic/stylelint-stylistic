import { createRule } from "../../../../rules/value-list-comma-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a comma opening the value, the space the option asks for having nowhere to go but the text of the inline comment in front of it`,
			code: `a { prop: // c\n,0; }`,
			fixed: `a { prop: // c\n,0; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a comma opening the value, the whitespace in front of it holding the break that closes an inline comment, which the fixer has to leave standing`,
			code: `a { prop: // c\n ,0; }`,
			fixed: `a { prop: // c\n ,0; }`,
			line: 2,
			column: 2,
			message: messages.rejectedBefore(),
		},
	],
})
