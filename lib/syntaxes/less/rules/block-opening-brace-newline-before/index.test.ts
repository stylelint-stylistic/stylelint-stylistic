import { createRule } from "../../../../rules/block-opening-brace-newline-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// The parser keeps the comment in the selector, so the brace would join it
			description: `an inline comment ending the selector, whose line break is what the brace stands behind`,
			code: `
				a // c
				{
				color: pink;
				}
			`,
			fixed: `
				a // c
				{
				color: pink;
				}
			`,
			line: 1,
			column: 7,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			// The parser keeps the comment in the params, so the brace would join it
			description: `an inline comment ending the params of an at-rule`,
			code: `
				@media screen // c
				{
				color: pink;
				}
			`,
			fixed: `
				@media screen // c
				{
				color: pink;
				}
			`,
			line: 1,
			column: 19,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// See #723
			description: `a rule standing in the rest of the text of an inline comment a semicolon of that text closed a declaration in, whose brace is no brace of code`,
			code: `
				a
				{
					color: pink // ; .b { c: d }
				}
			`,
		},
	],
})
