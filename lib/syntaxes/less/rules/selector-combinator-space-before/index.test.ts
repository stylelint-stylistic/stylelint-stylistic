import { createRule } from "../../../../rules/selector-combinator-space-before/index.ts"
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66
			description: `selector list whose second selector begins with a comment and a combinator`,
			code: `
				.a,
				/* A comment. */
				+ .b {}
			`,
		},
	],

	reject: [
		{
			description: `two spaces in front of the adjacent-sibling combinator`,
			code: `a  +a {}`,
			fixed: `a +a {}`,
			message: messages.expectedBefore(`+`),
		},
	],
})
