import { createRule } from "../../../../rules/selector-pseudo-element-case/index.ts"
import { scss } from "../../index.ts"

let { ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a pseudo-element built by interpolation`,
			code: `::#{$variable} {}`,
		},
		{
			description: `the same interpolation written in upper case`,
			code: `::#{$VARIABLE} {}`,
		},
		{
			description: `the same interpolation behind a type selector`,
			code: `a::#{$variable} {}`,
		},
		{
			description: `the same with a comment behind it`,
			code: `a::#{$variable}/*comment*/ {}`,
		},
	],
})
testRule({
	ruleName,
	config: [`upper`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a pseudo-element built by interpolation`,
			code: `::#{$variable} {}`,
		},
		{
			description: `the same interpolation written in upper case`,
			code: `::#{$VARIABLE} {}`,
		},
		{
			description: `the same interpolation behind a type selector`,
			code: `a::#{$variable} {}`,
		},
	],
})
