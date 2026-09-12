import { createRule } from "../../../../rules/declaration-block-semicolon-space-before/index.ts"
import { messages as trailingSemicolonMessages } from "../../../../rules/declaration-block-trailing-semicolon/index.ts"
import { scss } from "../../index.ts"

let { ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-trailing-semicolon": `always` },

	reject: [
		{
			// See #710
			description: `a plain CSS declaration closing its block without a semicolon, with the neighbour that adds one listed under the core's name, which reads the same file`,
			code: `a { color: red }`,
			fixed: `a { color: red ; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 15,
			message: trailingSemicolonMessages.expected,
		},
	],
})
