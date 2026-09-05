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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/398
			description: `a call named with an ASCII word in front of the three letters of an address, whose double slashes open a comment the brace has nowhere to go past`,
			code: `a { b: aurl(http://a/b.png) 1px; }`,
			fixed: `a { b: aurl(http://a/b.png) 1px; }`,
			line: 1,
			column: 33,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same call named with a code point of an identifier that lies outside ASCII`,
			code: `a { b: éurl(http://a/b.png) 1px; }`,
			fixed: `a { b: éurl(http://a/b.png) 1px; }`,
			line: 1,
			column: 33,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same call named with an interpolation, whose closing brace stands where a run of a name stands`,
			code: `a { b: @{p}url(http://a/b.png) 1px; }`,
			fixed: `a { b: @{p}url(http://a/b.png) 1px; }`,
			line: 1,
			column: 36,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same call named with a hexadecimal escape, whose closing whitespace is no character of its own`,
			code: `a { b: \\75 url(http://a/b.png) 1px; }`,
			fixed: `a { b: \\75 url(http://a/b.png) 1px; }`,
			line: 1,
			column: 36,
			message: messages.rejectedBefore(),
		},
		{
			description: `an address whose name is spelled with an escape, which holds no comment and takes the brace`,
			code: `a { b: u\\rl(http://a/b.png) 1px; }`,
			fixed: `a { b: u\\rl(http://a/b.png) 1px;}`,
			line: 1,
			column: 33,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/566
			description: `an address behind a backslash and a form feed, which the grammar reads a newline in, so that the backslash spells nothing and names nothing, and the address takes the brace`,
			code: `a { b: \\\furl(http://a/b.png) 1px; }`,
			fixed: `a { b: \\\furl(http://a/b.png) 1px;}`,
			line: 1,
			column: 34,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same address behind a backslash and a bare carriage return`,
			code: `a { b: \\\rurl(http://a/b.png) 1px; }`,
			fixed: `a { b: \\\rurl(http://a/b.png) 1px;}`,
			line: 1,
			column: 34,
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
