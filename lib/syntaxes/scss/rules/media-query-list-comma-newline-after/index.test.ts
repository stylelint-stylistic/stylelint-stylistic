import { createRule } from "../../../../rules/media-query-list-comma-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`always`],

	accept: [
		{
			description: `an end-of-line comment standing right after the comma`,
			code: `@media screen and (color),// scss\n projection and (color) {}`,
		},
		{
			description: `a tab, a space, and an end-of-line comment after the comma`,
			code: `@media screen and (color),\t // scss\n projection and (color) {}`,
		},
		{
			description: `an end-of-line comment on the line after the comma`,
			code: `@media screen and (color),\n// scss\n projection and (color) {}`,
		},
	],
})
