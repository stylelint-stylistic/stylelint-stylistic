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
		{
			description: `a block of an at-rule whose inline comment is closed by a line break, so the block spans two lines`,
			code: `
				@font-face { font-family: x; // c
				 src: y; }
			`,
		},
	],

	reject: [
		{
			description: `a variable beside a declaration, which the parser files as a declaration too`,
			code: `a { $x: 1; color: pink; }`,
			fixed: `
				a {
				$x: 1;
				color: pink;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 26,
			message: messages.expected(1),
		},
		{
			description: `a placeholder's single-line block holding two declarations`,
			code: `%p { color: pink; top: 3px; }`,
			fixed: `
				%p {
				color: pink;
				top: 3px;
				}
			`,
			line: 1,
			column: 4,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(1),
		},
		{
			description: `a nested property's single-line block holding two declarations, which the parser files as a rule`,
			code: `a { font: { family: x; size: 1px; } }`,
			fixed: `
				a { font: {
				family: x;
				size: 1px;
				} }
			`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 36,
			message: messages.expected(1),
		},
		// #640
		{
			description: `a mixin inclusion's single-line content block holding two declarations`,
			code: `@include m { color: pink; top: 0; }`,
			fixed: `
				@include m {
				color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 12,
			endLine: 1,
			endColumn: 36,
			message: messages.expected(1),
		},
		{
			description: `a mixin definition's single-line block holding two declarations`,
			code: `@mixin m($a) { color: pink; top: 0; }`,
			fixed: `
				@mixin m($a) {
				color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 38,
			message: messages.expected(1),
		},
		{
			description: `a mixin inclusion's content block nested in a rule, whose warning stands on the nested block`,
			code: `a { @include m { color: pink; top: 0; } }`,
			fixed: `
				a { @include m {
				color: pink;
				top: 0;
				} }
			`,
			line: 1,
			column: 16,
			endLine: 1,
			endColumn: 40,
			message: messages.expected(1),
		},
		// #641
		{
			description: `a mixin inclusion closing the block, an at-rule without a block, which the fix puts on a line of its own too`,
			code: `a { color: pink; top: 3px; @include m; }`,
			fixed: `
				a {
				color: pink;
				top: 3px;
				@include m;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 41,
			message: messages.expected(1),
		},
	],
})
