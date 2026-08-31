import { createRule } from "../../../../rules/media-query-list-comma-newline-after/index.ts"
import { less } from "../../index.ts"

let { ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],

	accept: [
		{
			description: `an end-of-line comment standing right after the comma`,
			code: `@media screen and (color),// less\n projection and (color) {}`,
		},
		{
			description: `a tab, a space, an end-of-line comment, and a carriage-return line break`,
			code: `@media screen and (color),\t // less\r\n projection and (color) {}`,
		},
		{
			description: `an end-of-line comment on the line after the comma`,
			code: `@media screen and (color),\n// less\n projection and (color) {}`,
		},
	],
})
