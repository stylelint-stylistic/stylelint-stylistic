import { createRule } from "../../../../rules/at-rule-name-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`always`],

	accept: [
		{
			description: `a mixin and an include, each with a space behind its name`,
			code: `@mixin mixin() { @content; }; .colors { @include mixin { color: $color; }}`,
		},
	],
})
