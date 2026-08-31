import { createRule } from "../../../../rules/selector-attribute-operator-space-before/index.ts"
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
			code: `.a // c\n[t ='y'] {}`,
			fixed: `.a // c\n[t='y'] {}`,
			line: 2,
			column: 4,
			message: messages.rejectedBefore(`=`),
		},
	],
})
