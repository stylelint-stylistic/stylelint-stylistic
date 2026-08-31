import { createRule } from "../../../../rules/selector-combinator-space-after/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],

	accept: [
		{
			description: `a Less guard, whose comparisons are no combinators`,
			code: `.a when (@size>=60) and (@size<102) {}`,
		},
	],

	reject: [
		{
			description: `two spaces after the adjacent-sibling combinator`,
			code: `a+  a {}`,
			fixed: `a+ a {}`,
			message: messages.expectedAfter(`+`),
		},
	],
})
