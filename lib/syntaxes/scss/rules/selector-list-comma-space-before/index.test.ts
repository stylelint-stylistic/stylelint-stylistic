import { createRule } from "../../../../rules/selector-list-comma-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\n.b , .c {}`,
			fixed: `.a // c\n.b, .c {}`,
			line: 2,
			column: 4,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			code: `.a // c\n, .b {}`,
			fixed: `.a // c\n, .b {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			code: `.a // c\n, .b {}`,
			fixed: `.a // c\n, .b {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})
