import { createRule } from "../../../../rules/declaration-block-semicolon-space-after/index.ts"
import { less } from "../../index.ts"

let { ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a declaration a semicolon of the text of its inline comment closed, the semicolon Less closes it on standing on a line of its own`,
			code: `
				a {
					color: pink // ;
					;
					top: 0;
				}
			`,
		},
	],
})
