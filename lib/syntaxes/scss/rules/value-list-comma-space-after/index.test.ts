import { createRule } from "../../../../rules/value-list-comma-space-after/index.ts"
import { scss } from "../../index.ts"

let { messages, ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// A form feed closes an inline comment under Sass, so what stands behind one is the value's own
			description: `a form feed inside an inline comment, which closes it, so the two commas behind it are the value's own`,
			code: `a { b: 1px // c\f,2px ,3px; }`,
			fixed: `a { b: 1px // c\f, 2px , 3px; }`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 22,
					message: messages.expectedAfter(),
				},
			],
		},
	],
})
