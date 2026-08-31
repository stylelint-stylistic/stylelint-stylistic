import { createRule } from "../../../../rules/selector-list-comma-newline-after/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a Less CSS guard written with no space in front of its condition, which the comma of the list stands behind`,
			code: `.a:hover when(1 = 1), .b { color: red; }`,
		},
		{
			description: `the same, with a condition list of its own, whose comma is none of this rule's business`,
			code: `.a:hover when(1 = 1), (2 = 2) { color: red; }`,
		},
		{
			description: `an end-of-line comment standing between the comma and the newline`,
			code: `a, // comment\nb {}`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `a,   // comment\nb {}`,
		},
		{
			description: `the same behind a tab`,
			code: `a,\t// comment\nb {}`,
		},
		{
			description: `the same behind two tabs`,
			code: `a,\t\t// comment\nb {}`,
		},
		{
			description: `the same behind tabs and spaces`,
			code: `a, \t \t // comment\nb {}`,
		},
		{
			description: `a Less mixin whose parameters carry commas of their own`,
			code: `.col( @a, @b ) {}`,
		},
		{
			description: `the same mixin, its name ending in a digit`,
			code: `.col3( @a, @b ) {}`,
		},
		{
			description: `a CSS guard, which the comma of the list stands behind`,
			code: `.a:hover when (1 = 1), .b { color: red; }`,
		},
	],

	reject: [
		{
			description: `a guard keyword written in another case, which Less reads as no keyword at all`,
			code: `.a:hover WHEN (1 = 1), .b { color: red; }`,
			fixed: `.a:hover WHEN (1 = 1),\n .b { color: red; }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
	],
})
