import { createRule } from "../../../../rules/value-list-comma-newline-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a comma opening the value behind an inline comment, closed by the break the rule asks for`,
			code: `a { prop: // c\n,0; }`,
		},
	],

	reject: [
		{
			// Pins the end of an inline comment where the parser cuts it, so the fix writes behind the comment rather than into it
			description: `a comma behind an inline comment that a bare carriage return closes`,
			code: `a { prop: 1px // c\r,0; }`,
			fixed: `a { prop: 1px // c\r\n,0; }`,
			line: 1,
			column: 20,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a comma standing in the text of an inline comment a backslash stands against, which this parser reads as a comment all the same`,
			code: `a { prop: 1px \\//c ,\n2px; }`,
		},
	],

	reject: [
		{
			description: `a comma opening the value, the whitespace in front of it holding the break that closes an inline comment, which the fixer has to leave standing`,
			code: `a { prop: // c\n ,0,\n1; }`,
			fixed: `a { prop: // c\n ,0,\n1; }`,
			line: 2,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
