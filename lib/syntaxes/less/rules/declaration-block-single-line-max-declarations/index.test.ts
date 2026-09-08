import { createRule } from "../../../../rules/declaration-block-single-line-max-declarations/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a mixin call alone in the block`,
			code: `a { .tab-focus(); }`,
		},
		{
			description: `a mixin call beside the one declaration, which the parser files as an at-rule`,
			code: `a { .m(); color: pink; }`,
		},
		{
			description: `a variable beside the one declaration, which the parser files as an at-rule`,
			code: `a { @v: 1; color: pink; }`,
		},
		{
			description: `a block whose inline comment is closed by a line break, so the block spans two lines`,
			code: `
				a { color: pink; // c
				 top: 3px; }
			`,
		},
		{
			description: `a detached ruleset's call beside the one declaration, which is an at-rule without a block`,
			code: `a { @detached(); color: pink; }`,
		},
		{
			description: `a mixin call beside the one declaration in the block of an at-rule`,
			code: `@media (x) { .m(); color: pink; }`,
		},
	],

	reject: [
		{
			description: `a mixin definition's single-line block holding two declarations`,
			code: `.m() { color: pink; top: 3px; }`,
			fixed: `
				.m() {
				color: pink;
				top: 3px;
				}
			`,
			line: 1,
			column: 6,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(1),
		},
		{
			description: `two declarations around a mixin call carrying a flag, whose block is measured as the file spells it`,
			code: `a { color: pink; .m() !important; top: 3px; }`,
			fixed: `
				a {
				color: pink;
				.m() !important;
				top: 3px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 46,
			message: messages.expected(1),
		},
		// #640
		{
			description: `a detached ruleset's single-line block holding two declarations, which the parser files as an at-rule`,
			code: `@detached: { color: pink; top: 0; }`,
			fixed: `
				@detached: {
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
		// #641
		{
			description: `a mixin call written without a semicolon closing the block, which holds the run in front of the brace, so the fix writes the break there`,
			code: `a { color: pink; top: 3px; .m() }`,
			fixed: `
				a {
				color: pink;
				top: 3px;
				.m()
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 34,
			message: messages.expected(1),
		},
		{
			description: `a mixin call closing the block with its semicolon, behind which the run in front of the brace is the block's own`,
			code: `a { color: pink; top: 3px; .m(); }`,
			fixed: `
				a {
				color: pink;
				top: 3px;
				.m();
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 35,
			message: messages.expected(1),
		},
		{
			description: `a variable in front of the two declarations, behind which no rule speaks of the run, so it gets the break`,
			code: `a { @v: 1; color: pink; top: 3px; }`,
			fixed: `
				a {
				@v: 1;
				color: pink;
				top: 3px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 36,
			message: messages.expected(1),
		},
	],
})
