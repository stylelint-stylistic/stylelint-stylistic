import { createRule } from "../../../../rules/selector-descendant-combinator-no-non-space/index.ts"
import { less } from "../../index.ts"

let { ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a Less guard behind a pseudo-class`,
			code: `:hover when (@variable = true) { color: red; }`,
		},
		{
			description: `the same guard behind a type selector and a pseudo-class`,
			code: `a:hover when (@variable = true) { color: red; }`,
		},
		{
			description: `a guard naming no variable, on a selector carrying a colon`,
			code: `.a:hover when (1 = 1) { color: red; }`,
		},
		{
			description: `a negated guard naming no variable`,
			code: `.a:hover when not (1 = 1) { color: red; }`,
		},
		{
			description: `a guard calling a function`,
			code: `.a::before when (default()) { color: red; }`,
		},
		{
			description: `a guard written with no space in front of its condition, which Less takes as readily`,
			code: `.a:hover when(1 = 1) { color: red; }`,
		},
		{
			description: `the same, negated`,
			code: `.a:hover when not(1 = 1) { color: red; }`,
		},
		{
			description: `a guard on a class name carrying an escaped quote, which opens no string`,
			code: String.raw`.x\'y:hover when ('z' = 'w') { color: red; }`,
		},
	],
})
