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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			// Sass compiles every spelling of the name to a plain address, and `lightningcss` reads one in every spelling too, so what stands inside the parentheses is a URL and nothing a rule may write to.
			description: `a comma inside an address whose name an escape spells, which is a comma of the address`,
			code: `a { b: u\\rl(a,b); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			description: `the same comma inside an address whose name a hexadecimal escape spells, which the value parser hands the rule as a word and a call of two letters`,
			code: `a { b: \\75 rl(a,b); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px, 2px // a, b\n  ); }`,
		},
	],
})
