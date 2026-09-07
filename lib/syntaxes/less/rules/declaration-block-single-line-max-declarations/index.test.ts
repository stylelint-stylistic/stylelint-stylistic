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
	],

	reject: [
		{
			description: `a mixin definition's single-line block holding two declarations`,
			code: `.m() { color: pink; top: 3px; }`,
			line: 1,
			column: 6,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(1),
		},
		{
			description: `two declarations around a mixin call carrying a flag, whose block is measured as the file spells it`,
			code: `a { color: pink; .m() !important; top: 3px; }`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 46,
			message: messages.expected(1),
		},
	],
})
