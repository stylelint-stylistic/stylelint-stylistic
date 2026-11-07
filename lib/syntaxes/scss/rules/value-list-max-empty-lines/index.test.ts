import { createRule } from "../../../../rules/value-list-max-empty-lines/index.ts"
import { scss } from "../../index.ts"

let { ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [0],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `blank lines behind a // comment ending a custom property's value, which belong to the block`,
			code: `a {--b: red // c\n\n\n}`,
			customSyntax: `postcss-scss`,
		},
	],

	reject: [],
})
