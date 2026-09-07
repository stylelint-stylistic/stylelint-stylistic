import { createRule } from "../../../../rules/function-comma-space-after/index.ts"
import { less } from "../../index.ts"

let { ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// See #135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px,2px // a, b\n  ); }`,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// Sass and `lightningcss` both read the escaped name as `url`, so what stands inside the parentheses is an address no rule may write to. See #344
			description: `a comma inside an address whose name an escape spells, which is a comma of the address`,
			code: `a { b: u\\rl(a,b); }`,
		},
		{
			// See #344
			description: `the same comma inside an address whose name a hexadecimal escape spells, which the value parser hands the rule as a word and a call of two letters`,
			code: `a { b: \\75 rl(a,b); }`,
		},
		{
			// See #135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px, 2px // a, b\n  ); }`,
		},
	],
})
