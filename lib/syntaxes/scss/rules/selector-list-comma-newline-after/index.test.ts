import { createRule } from "../../../../rules/selector-list-comma-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an end-of-line comment standing between the comma and the newline`,
			code: `a, // comment\nb {}`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `a,   // comment\nb {}`,
		},
		{
			description: `the same behind a tab`,
			code: `a,\t// comment\nb {}`,
		},
		{
			description: `the same behind two tabs`,
			code: `a,\t\t// comment\nb {}`,
		},
		{
			description: `the same behind tabs and spaces`,
			code: `a, \t \t // comment\nb {}`,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\n.b, .c {}`,
			fixed: `.a // c\n.b,\n .c {}`,
			line: 2,
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
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			code: `.a, // c\n.b {}`,
			fixed: `.a, // c\n.b {}`,
			line: 1,
			column: 3,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})
