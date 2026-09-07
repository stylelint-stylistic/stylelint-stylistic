import { createRule } from "../../../../rules/declaration-block-single-line-max-declarations/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a block whose inline comment is closed by a line break, so the block spans two lines`,
			code: `
				a { color: pink; // c
				 top: 3px; }
			`,
		},
		{
			description: `a mixin inclusion beside the one declaration, which is an at-rule and no declaration`,
			code: `a { @include m; color: pink; }`,
		},
		{
			description: `an extension beside the one declaration, which is an at-rule and no declaration`,
			code: `a { color: pink; @extend %p; }`,
		},
	],

	reject: [
		{
			description: `a variable beside a declaration, which the parser files as a declaration too`,
			code: `a { $x: 1; color: pink; }`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 26,
			message: messages.expected(1),
		},
		{
			description: `a placeholder's single-line block holding two declarations`,
			code: `%p { color: pink; top: 3px; }`,
			line: 1,
			column: 4,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(1),
		},
		{
			description: `a nested property's single-line block holding two declarations, which the parser files as a rule`,
			code: `a { font: { family: x; size: 1px; } }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 36,
			message: messages.expected(1),
		},
	],
})
