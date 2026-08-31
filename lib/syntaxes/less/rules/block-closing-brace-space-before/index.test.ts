import { createRule } from "../../../../rules/block-closing-brace-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
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
			message: messages.expectedBefore(),
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
			message: messages.expectedBefore(),
		},
		{
			description: `a block whose closing brace the comment has already swallowed, which no option can put right`,
			code: `
				a {
					color: pink // c}
			`,
			fixed: `
				a {
					color: pink // c}
			`,
			line: 2,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a block a mixin call with no semicolon of its own closes, the break in front of the brace parsed into that call`,
			code: `
				a {
					.m()
				}
			`,
			fixed: `
				a {
					.m() }
			`,
			line: 2,
			column: 6,
			message: messages.expectedBefore(),
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
			message: messages.rejectedBefore(),
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
			message: messages.rejectedBefore(),
		},
		{
			description: `a comment closed by the break of the whitespace its own declaration ends with, behind which the semicolon stands on a line of its own`,
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
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
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
			message: messages.rejectedBefore(),
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
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/333
			description: `a form feed inside an inline comment, which is whitespace and no line break, so the brace stands in the comment's text and the block is left alone`,
			code: `a { b: 1px // c\f\t2px; }`,
			fixed: `a { b: 1px // c\f\t2px; }`,
			line: 1,
			column: 22,
			message: messages.rejectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
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
			message: messages.expectedBeforeMultiLine(),
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
			message: messages.expectedBeforeMultiLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
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
			message: messages.rejectedBeforeMultiLine(),
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
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a single-line block whose closing brace the comment has already swallowed, which the option cannot put right`,
			code: `a { color: pink // c}`,
			fixed: `a { color: pink // c}`,
			line: 1,
			column: 20,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a single-line block whose closing brace the comment has already swallowed, which the option cannot put right`,
			code: `a { color: pink // c }`,
			fixed: `a { color: pink // c }`,
			line: 1,
			column: 21,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})
