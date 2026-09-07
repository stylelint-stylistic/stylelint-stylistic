import { createRule } from "../../../../rules/no-eol-whitespace/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

// A space no editor trims from the end of a line.
const S = ` `

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	reject: [
		{
			// See #254
			description: `two spaces making up the whole of an inline comment a file ends on`,
			// This syntax files such a comment as `postcss-scss` files every one: an empty text, the whitespace in the raw in front and nothing in the raw behind.
			code: `//  `,
			fixed: `//`,
			warnings: [
				{
					line: 1,
					column: 4,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a Less at-variable keeps the fix written to its params`,
			code: `
				@foo: (
					a,${S}${S}${S}
					b
				);
			`,
			fixed: `
				@foo: (
					a,
					b
				);
			`,
			line: 2,
			column: 6,
			message: messages.rejected,
		},
	],
})
