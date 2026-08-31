import { createRule } from "../../../../rules/declaration-colon-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `a value that is nothing but an inline comment and a flag, whose run behind the colon this syntax keeps in the value's raw`,
			code: `a { color:  // c\n!important; }`,
			fixed: `a { color:\n  // c\n!important; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
	],
})
