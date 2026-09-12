import { createRule } from "../../../../rules/at-rule-name-newline-after/index.ts"
import { scss } from "../../index.ts"

let { messages, ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`always`],

	accept: [
		{
			description: `a mixin and an include, each with the break behind its name`,
			code: `@mixin\nmixin() { @content; }; .colors { @include\nmixin { color: $color; }}`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@mixin\r\nmixin() { @content; }; .colors { @include\r\nmixin { color: $color; }}`,
		},
	],

	reject: [
		// See #696
		{
			description: `the same pair written with a space where each break belongs`,
			code: `@mixin mixin() { @content; }; .colors { @include mixin { color: $color; }}`,
			fixed: `@mixin\n mixin() { @content; }; .colors { @include\n mixin { color: $color; }}`,
			warnings: [
				{
					line: 1,
					column: 6,
					message: messages.expectedAfter(`@mixin`),
				},
				{
					line: 1,
					column: 48,
					message: messages.expectedAfter(`@include`),
				},
			],
		},
	],
})
