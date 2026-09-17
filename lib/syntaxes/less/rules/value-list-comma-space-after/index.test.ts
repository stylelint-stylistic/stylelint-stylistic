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
			// See #321
			description: `a comma behind a double slash whose first character an escape spells, which opens no comment`,
			code: `a { b: c\\//d 1px,2px; }`,
			fixed: `a { b: c\\//d 1px, 2px; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of a string inside parentheses the tokenizer reads as code behind a solidus glued to the name, whose comma is no comma of the list (1789637913)
			description: `no space after the comma behind a bare address whose name a solidus is glued to, holding a string with a closing parenthesis and a comma, which are text of the string`,
			code: `a { b: 1px, 1/url(a "),b" ),2px; }`,
			fixed: `a { b: 1px, 1/url(a "),b" ), 2px; }`,
			line: 1,
			column: 28,
			message: messages.expectedAfter(),
		},
	],
})
