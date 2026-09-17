import { createRule } from "../../../../rules/media-feature-slash-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// Pins the reading of the url token `postcss-scss` opens behind whitespace and closes by the count of parentheses, through a string
			description: `a solidus glued to the name of a bare address a space parts from its parenthesis, opening on whitespace and holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `@media (a: 1/url ( b ")" c)) { d { e: 1px } }`,
			fixed: `@media (a: 1/url ( b ")" c)) { d { e: 1px } }`,
			line: 1,
			column: 13,
			message: messages.expectedAfter(),
		},
	],
})
