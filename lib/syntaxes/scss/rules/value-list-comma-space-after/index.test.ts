import { createRule } from "../../../../rules/value-list-comma-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/115
			description: `a form feed inside an inline comment, which is whitespace and closes no comment, so the commas behind it are the comment's text`,
			code: `a { b: 1px // c\f,2px ,3px; }`,
		},
	],
})
