import { createRule } from "../../../../rules/media-feature-slash-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a ratio whose numerator is a variable, which Less keeps as it stands under its default math mode`,
			code: `@media (aspect-ratio: @a/9) {}`,
			fixed: `@media (aspect-ratio: @a /9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
	],
})
