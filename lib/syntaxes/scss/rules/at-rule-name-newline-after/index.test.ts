import { createRule } from "../../../../rules/at-rule-name-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName } = createRule(scss)

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
})
