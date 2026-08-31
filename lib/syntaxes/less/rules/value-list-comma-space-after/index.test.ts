import { createRule } from "../../../../rules/value-list-comma-space-after/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/321
			description: `a comma behind a double slash whose first character an escape spells, which opens no comment`,
			code: `a { b: c\\//d 1px,2px; }`,
			fixed: `a { b: c\\//d 1px, 2px; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
	],
})
