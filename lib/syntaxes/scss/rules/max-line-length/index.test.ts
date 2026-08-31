import { createRule } from "../../../../rules/max-line-length/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [20],

	reject: [
		{
			description: `an end-of-line comment over the limit`,
			code: `
				a {
				    // Lorem ipsum dolor sit amet. The comment Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium officia fugiat unde deserunt sit, tenetur! Incidunt similique blanditiis placeat ad quia possimus libero, reiciendis excepturi non esse deserunt a odit.
				}
			`,
			line: 2,
			column: 269,
			message: messages.expected(20),
		},
	],
})
