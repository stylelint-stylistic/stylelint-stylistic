import { createRule } from "../../../../rules/selector-list-comma-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\n.b,.c {}`,
			fixed: `.a // c\n.b, .c {}`,
			line: 2,
			column: 3,
			message: messages.expectedAfter(),
		},
	],
})
