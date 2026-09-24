import { createRule } from "../../../../rules/selector-list-comma-newline-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// Pins the end of an inline comment where the parser cuts it, so the fix writes behind the comment rather than repeating the word after the comma
			description: `a comma behind an inline comment that a bare carriage return closes`,
			code: `a // c\r, b {}`,
			fixed: `a // c\r\n, b {}`,
			line: 1,
			column: 8,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\n.b\n, .c {}`,
			fixed: `.a // c\n.b, .c {}`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			code: `.a // c\n, .b {}`,
			fixed: `.a // c\n, .b {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
