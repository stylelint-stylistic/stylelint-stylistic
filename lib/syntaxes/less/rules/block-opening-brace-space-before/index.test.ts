import { createRule } from "../../../../rules/block-opening-brace-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// The parser keeps the comment in the selector, so the space would land inside it
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
			message: messages.expectedBefore(),
		},
		{
			// The parser keeps the comment in the params, so the space would land inside it
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
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
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
			message: messages.rejectedBefore(),
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
			message: messages.rejectedBefore(),
		},
		{
			// A block comment behind the inline one's break is code the brace may abut
			description: `a block comment on the line behind an inline comment ending the selector`,
			code: `
				a // c
				/* d */ {
				color: pink;
				}
			`,
			fixed: `
				a // c
				/* d */{
				color: pink;
				}
			`,
			line: 2,
			column: 8,
			message: messages.rejectedBefore(),
		},
	],
})
