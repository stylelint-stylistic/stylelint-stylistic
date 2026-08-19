import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { background-size: 0,\n0; }`,
		},
		{
			code: `a { background-size: 0,\n\n0; }`,
		},
		{
			code: `a { background-size: 0 ,\n  0; }`,
		},
		{
			code: `a { background-size: 0 ,\r\n  0; }`,
			description: `CRLF`,
		},
		{
			code: `a { background-size: 0 ,\r\n\r\n  0; }`,
			description: `Double CRLF`,
		},
		{
			code: `a::before { content: "foo,bar,baz"; }`,
			description: `string`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `ignores function`,
		},
		{
			code: `$grid-breakpoints: (\n(xs),\n(sm, 768px)\n) !default;`,
			description: `ignores scss maps`,
		},
		{
			code: `a { background-size: 0, //\n0; }`,
			description: `ignores single line comments`,
		},
		{
			code: `a { background-size: 0, /**/\n0; }`,
			description: `ignores multi line comments`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			autoStripIndent: true,
			code: `
				a { background: url(http://x/y.png),
				url(http://x/z.png); }
			`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0,\n 0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0,\n  0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0,\n\t0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, /**/0; }`,
			fixed: `a { background-size: 0, /**/\n0; }`,
			message: messages.expectedAfter(),
			description: `ignores multi line comments`,
			line: 1,
			column: 28,
		},
		{
			code: `a { prop: ,0; }`,
			fixed: `a { prop: ,\n0; }`,
			description: `a comma opening the value, which is the value's first character`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { pr,op: 0,0; }`,
			fixed: `a { pr,op: 0,\n0; }`,
			description: `a comma inside the property name, which the fixer has to leave standing`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 13,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma behind a bare address, whose double slash opens no comment`,
			autoStripIndent: true,
			code: `a { background: url(http://x/y.png),url(http://x/z.png); }`,
			fixed: `
				a { background: url(http://x/y.png),
				url(http://x/z.png); }
			`,
			message: messages.expectedAfter(),
			line: 1,
			column: 36,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a { background-size: 0,\n0,\n0; }`,
		},
		{
			code: `a { background-size: 0, //\n0, /**/\n0; }`,
			description: `with comments`,
		},
		{
			code: `a { background-size: 0 ,\n  0,\n0; }`,
		},
		{
			code: `a { background-size: 0 ,\r\n  0,\r\n0; }`,
			description: `CRLF`,
		},
		{
			code: `a { background-size: 0, 0; }`,
			description: `ignores single-line`,
		},
		{
			code: `a { background-size: 0, 0;\n}`,
			description: `ignores single-line list, multi-line block`,
		},
		{
			code: `a { background-size: 0, 0;\r\n}`,
			description: `ignores single-line list, multi-line block with CRLF`,
		},
		{
			code: `a { background-size: 0, /**/ 0; }`,
			description: `ignores single-line list, multi-line block with comment`,
		},
	],

	reject: [
		{
			code: `a { prop: ,0,\n1; }`,
			fixed: `a { prop: ,\n0,\n1; }`,
			description: `a comma opening the value, which is the value's first character`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { background-size: 0,\n0, 0; }`,
			fixed: `a { background-size: 0,\n0,\n 0; }`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `a { background-size: 0, //\n0, /**/0; }`,
			fixed: `a { background-size: 0, //\n0, /**/\n0; }`,
			description: `with comments`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 7,
		},
		{
			code: `a { background-size: 0,\n0,  0; }`,
			fixed: `a { background-size: 0,\n0,\n  0; }`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `a { background-size: 0,\n0,\t0; }`,
			fixed: `a { background-size: 0,\n0,\n\t0; }`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `a { background-size: 0,\r\n0,\t0; }`,
			fixed: `a { background-size: 0,\r\n0,\r\n\t0; }`,
			description: `CRLF`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a { background-size: 0\n,0\n,0; }`,
		},
		{
			code: `a { background-size: 0 //\n,0 /**/\n,0; }`,
			description: `with comments`,
		},
		{
			code: `a { background-size: 0\r\n,0\r\n,0; }`,
			description: `CRLF`,
		},
		{
			code: `a { background-size: 0, 0; }`,
			description: `ignores single-line`,
		},
		{
			code: `a { background-size: 0, 0;\n}`,
			description: `ignores single-line list, multi-line block`,
		},
		{
			code: `a { background-size: 0, 0;\r\n}`,
			description: `ignores single-line list, multi-line block with CRLF`,
		},
	],

	reject: [
		{
			code: `a { prop: ,\n0; }`,
			fixed: `a { prop: ,0; }`,
			description: `a comma opening the value, whose whitespace belongs to the value like any other`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { background-size: 0\n,0\n, 0; }`,
			fixed: `a { background-size: 0\n,0\n,0; }`,
			message: messages.rejectedAfterMultiLine(),
			line: 3,
			column: 1,
		},
		{
			code: `a { background-size: 0\n,0\n,  0; }`,
			fixed: `a { background-size: 0\n,0\n,0; }`,
			message: messages.rejectedAfterMultiLine(),
			line: 3,
			column: 1,
		},
		{
			code: `a { background-size: 0\r\n,0\r\n,  0; }`,
			fixed: `a { background-size: 0\r\n,0\r\n,0; }`,
			description: `CRLF`,
			message: messages.rejectedAfterMultiLine(),
			line: 3,
			column: 1,
		},
		{
			code: `a { background-size: 0\n,0\n,\t0; }`,
			fixed: `a { background-size: 0\n,0\n,0; }`,
			message: messages.rejectedAfterMultiLine(),
			line: 3,
			column: 1,
		},
	],
})
