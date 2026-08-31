import { createRule } from "../../../../rules/selector-attribute-brackets-space-inside/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/190
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\n:not( [ t='y' ] ) {}`,
			fixed: `.a // c\n:not( [t='y'] ) {}`,
			warnings: [
				{
					line: 2,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 2,
					column: 15,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `the same, with the comment behind the attribute`,
			code: `[ t='y' ] // c\n{}`,
			fixed: `[t='y'] // c\n{}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 8,
					message: messages.rejectedClosing,
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a selector carrying an inline comment, spaced out with the comment spelled as the file spells it`,
			code: `.a // c\n[t='y'] {}`,
			fixed: `.a // c\n[ t='y' ] {}`,
			warnings: [
				{
					line: 2,
					column: 2,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 6,
					message: messages.expectedClosing,
				},
			],
		},
	],
})
