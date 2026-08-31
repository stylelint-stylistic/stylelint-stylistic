import { createRule } from "../../../../rules/selector-list-comma-space-after/index.ts"
import { less } from "../../index.ts"

let { ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a Less mixin whose parameters carry commas of their own`,
			code: `.col( @a,@b ) {}`,
		},
		{
			description: `the same mixin, its name ending in a digit`,
			code: `.col3( @a,@b ) {}`,
		},
	],
})
