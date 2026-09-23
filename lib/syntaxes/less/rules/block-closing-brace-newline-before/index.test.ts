import { createRule } from "../../../../rules/block-closing-brace-newline-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// See #720
			description: `a block whose last declaration a semicolon of the text of its inline comment closed, and a block comment carved out of that text standing last, so the brace still has nowhere to go`,
			code: `
				a {
					color: pink // ; /* c */ ;
				}
			`,
			fixed: `
				a {
					color: pink // ; /* c */ ;
				}
			`,
			line: 2,
			column: 28,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a block whose last declaration carries an inline comment behind its value, so the brace has nowhere to go`,
			code: `
				a {
					color: pink // c
				}
			`,
			fixed: `
				a {
					color: pink // c
				}
			`,
			line: 2,
			column: 18,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block with the comment standing on a line of its own`,
			code: `
				a {
					color: pink;
					// c
				}
			`,
			fixed: `
				a {
					color: pink;
					// c
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a comment closed by the break of the whitespace its own declaration ends with, which this option never reaches, behind which the semicolon stands on a line of its own`,
			code: `
				a {
					color: pink // c
					;
				}
			`,
			fixed: `
				a {
					color: pink // c
					;}
			`,
			line: 3,
			column: 3,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			// See #292
			description: `a block a mixin call with no semicolon of its own closes, the break in front of the brace parsed into that call`,
			code: `
				a {
					.m()
				}
			`,
			fixed: `
				a {
					.m()}
			`,
			line: 2,
			column: 6,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block with an inline comment behind the call, so the brace has nowhere to go`,
			code: `
				a {
					.m()
					// c
				}
			`,
			fixed: `
				a {
					.m()
					// c
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			// See #374
			description: `a line break between a mixin call's important flag and the closing brace, which the parser collects into the call's raw along with the space in front of the flag`,
			code: `
				a {
					.m() !important
				}
			`,
			fixed: `
				a {
					.m() !important}
			`,
			line: 2,
			column: 17,
			message: messages.rejectedBeforeMultiLine,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// See #720
			description: `a block whose last declaration a semicolon of the text of its inline comment closed, the rest of that text spelling a space and another semicolon in front of the break`,
			code: `
				a {
					color: pink // ; ;
				}
			`,
		},
	],

	reject: [
		{
			description: `a block whose closing brace the comment has already swallowed, which the break this option writes puts right`,
			code: `
				a {
					color: pink // c}
			`,
			fixed: `
				a {
					color: pink // c
				}
			`,
			line: 2,
			column: 17,
			message: messages.expectedBefore,
		},
		{
			// See #374
			description: `a closing brace right behind a mixin call's important flag, where the break this option writes stays behind the flag rather than moving in front of it on the next parse`,
			code: `
				a {
					.m() !important}
			`,
			fixed: `
				a {
					.m() !important
				}
			`,
			line: 2,
			column: 16,
			message: messages.expectedBefore,
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a block whose closing brace the comment has already swallowed, which the break this option writes puts right`,
			code: `
				a {
					color: pink // c}
			`,
			fixed: `
				a {
					color: pink // c
				}
			`,
			line: 2,
			column: 17,
			message: messages.expectedBeforeMultiLine,
		},
	],
})
