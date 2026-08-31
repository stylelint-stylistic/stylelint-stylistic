import { createRule } from "../../../../rules/selector-max-empty-lines/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [0],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\n\n\n.b {}`,
			fixed: `.a // c\n.b {}`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
	],
})
