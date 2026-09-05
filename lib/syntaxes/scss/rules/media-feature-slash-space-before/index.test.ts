import { createRule } from "../../../../rules/media-feature-slash-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a ratio whose numerator is a variable, which Sass divides at`,
			code: `@media (aspect-ratio: $a/9) {}`,
		},
		{
			description: `a ratio whose denominator is a call, which Sass divides at`,
			code: `@media (min-aspect-ratio: 16/fn()) {}`,
		},
	],

	reject: [
		{
			description: `a ratio of two plain numbers, which Sass keeps as it stands`,
			code: `@media (aspect-ratio: 16/9) {}`,
			fixed: `@media (aspect-ratio: 16 /9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
	],
})
