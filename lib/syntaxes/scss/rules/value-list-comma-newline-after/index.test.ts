import { createRule } from "../../../../rules/value-list-comma-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map, whose inner commas the rule does not measure`,
			code: `
				$grid-breakpoints: (
				(xs),
				(sm, 768px)
				) !default;
			`,
		},
	],
})
