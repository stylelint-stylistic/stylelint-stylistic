import { createRule } from "../../../../rules/no-extra-semicolons/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `an import closed by its own semicolon`,
			code: `@import 'x.css';`,
		},
		{
			description: `two mixin calls, each closed by a semicolon`,
			code: `a { .mixin(); .mixin2; }`,
		},
		{
			description: `a second semicolon behind each mixin call, which the syntax reads as part of the call`,
			code: `a { .mixin();; .mixin2;; }`,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
			description: `the semicolon closing the declaration of a detached ruleset in front of a call to it, which the rule passes over`,
			code: `@dr: { color: red; }; @dr();`,
		},
	],

	reject: [
		{
			description: `a second semicolon behind a declaration standing after a mixin call`,
			code: `a { .mixin();\ncolor: red;; }`,
			fixed: `a { .mixin();\ncolor: red; }`,
			line: 2,
			column: 12,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
			description: `that same semicolon in front of an at-rule spelled without a space in front of its options`,
			code: `@dr: { color: red; }; @import(reference) "x";`,
			fixed: `@dr: { color: red; } @import(reference) "x";`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
	],
})
