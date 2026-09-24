import { messages as trailingSemicolonMessages } from "../../../../rules/declaration-block-trailing-semicolon/index.ts"
import { createRule } from "../../../../rules/declaration-colon-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-trailing-semicolon": `never` },

	reject: [
		{
			description: `a plain CSS value that is nothing but a space, with the neighbor that takes the semicolon away listed under the core's name, which reads the same file`,
			code: `a { color: ; }`,
			fixed: `a { color:}`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 12,
					endLine: 1,
					endColumn: 13,
					message: trailingSemicolonMessages.rejected,
				},
			],
		},
	],
})
