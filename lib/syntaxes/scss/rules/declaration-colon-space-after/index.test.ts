import { createRule } from "../../../../rules/declaration-colon-space-after/index.ts"
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
			fixed: `a { color: // c\n!important; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `the same value, whose run this option takes away without reaching into the text of the comment`,
			code: `a { color:  // c\n!important; }`,
			fixed: `a { color:// c\n!important; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
	],
})
