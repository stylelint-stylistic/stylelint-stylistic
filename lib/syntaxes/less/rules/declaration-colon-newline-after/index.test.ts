import { createRule } from "../../../../rules/declaration-colon-newline-after/index.ts"
import { less } from "../../index.ts"

let { ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a rule standing in the rest of the text of an inline comment a semicolon of that text closed a declaration in, whose colon is no colon of code`,
			code: `
				a {
					color:
						pink // ; .b { c: d }
				}
			`,
		},
	],
})
