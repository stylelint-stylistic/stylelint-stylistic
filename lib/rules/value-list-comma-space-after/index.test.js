import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { background-size: 0 , 0; }`,
		},
		{
			code: `a { background-size: 0, 0; }`,
		},
		{
			code: `a::before { content: "foo,bar,baz"; }`,
			description: `strings`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `function arguments`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0,0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size:\n\t0,  0; }`,
			fixed: `a { background-size:\n\t0, 0; }`,
			message: messages.expectedAfter(),
			line: 2,
			column: 3,
		},
		{
			code: `a { background-size: 0,\n0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\r\n0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `CRLF`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,/*1*/0; }`,
			fixed: `a { background-size: 0, /*1*/0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,0,0,0; }`,
			fixed: `a { background-size: 0, 0, 0, 0; }`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 23,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 25,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 27,
				},
			],
		},
		{
			code: `:root { --variable: 0,0; }`,
			fixed: `:root { --variable: 0, 0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 22,
		},
		{
			code: `a { prop: ,0; }`,
			fixed: `a { prop: , 0; }`,
			description: `a comma opening the value, which is the value's first character`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { --a: ,0; }`,
			fixed: `a { --a: , 0; }`,
			description: `the same, in a custom property`,
			message: messages.expectedAfter(),
			line: 1,
			column: 10,
		},
		{
			code: `a { pr,op: 0,0; }`,
			fixed: `a { pr,op: 0, 0; }`,
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
			code: `a{b: 0,0,0,0,0,0,0,0; }`,
			fixed: `a{b: 0, 0, 0, 0, 0, 0, 0, 0; }`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 9,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 11,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 13,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 15,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 17,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 19,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { background-size: 0 ,0; }`,
		},
		{
			code: `a { background-size: 0,0; }`,
		},
		{
			code: `a::before { content: "foo, bar, baz"; }`,
			description: `strings`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `function arguments`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0,0; }`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { prop: , 0; }`,
			fixed: `a { prop: ,0; }`,
			description: `a comma opening the value, whose whitespace belongs to the value like any other`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0,0; }`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\n0; }`,
			fixed: `a { background-size: 0,0; }`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\r\n0; }`,
			fixed: `a { background-size: 0,0; }`,
			description: `CRLF`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0,0; }`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, /*1*/ 0; }`,
			fixed: `a { background-size: 0,/*1*/ 0; }`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, 0, 0, 0 ; }`,
			fixed: `a { background-size: 0,0,0,0 ; }`,
			warnings: [
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 23,
				},
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 26,
				},
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 29,
				},
			],
		},
		{
			code: `:root { --variable: 0, 0; }`,
			fixed: `:root { --variable: 0,0; }`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 22,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a { background-size: 0 , 0; }`,
		},
		{
			code: `a { background-size: 0, 0; }`,
		},
		{
			code: `a { background-size: 0, 0;\n}`,
			description: `single-line list, multi-line block`,
		},
		{
			code: `a { background-size: 0, 0;\r\n}`,
			description: `single-line list, multi-line block with CRLF`,
		},
		{
			code: `a { background-size: 0\n,0}`,
			description: `ignores multi-line`,
		},
		{
			code: `a { background-size: 0\r\n,0}`,
			description: `ignores multi-line with CRLF`,
		},
		{
			code: `a::before { content: "foo,bar,baz"; }`,
			description: `strings`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `function arguments`,
		},
	],

	reject: [
		{
			code: `a { prop: ,0; }`,
			fixed: `a { prop: , 0; }`,
			description: `a comma opening the value, which is the value's first character`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { background-size: 0,0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,0;\n}`,
			fixed: `a { background-size: 0, 0;\n}`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,0;\r\n}`,
			fixed: `a { background-size: 0, 0;\r\n}`,
			description: `CRLF`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a { background-size: 0 ,0; }`,
		},
		{
			code: `a { background-size: 0,0; }`,
		},
		{
			code: `a { background-size: 0,0;\n}`,
			description: `single-line list, multi-line block`,
		},
		{
			code: `a { background-size: 0,0;\r\n}`,
			description: `single-line list, multi-line block with CRLF`,
		},
		{
			code: `a { background-size: 0\n,  0}`,
			description: `ignores multi-line values`,
		},
		{
			code: `a { background-size: 0\r\n,  0}`,
			description: `ignores multi-line values with CRLF`,
		},
		{
			code: `a::before { content: "foo, bar, baz"; }`,
			description: `strings`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `function arguments`,
		},
	],

	reject: [
		{
			code: `a { prop: , 0; }`,
			fixed: `a { prop: ,0; }`,
			description: `a comma opening the value, whose whitespace belongs to the value like any other`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0,0; }`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, 0;\n}`,
			fixed: `a { background-size: 0,0;\n}`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, 0;\r\n}`,
			fixed: `a { background-size: 0,0;\r\n}`,
			description: `CRLF`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0,0; }`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0,0; }`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/115
			description: `a form feed closes an inline comment in this syntax, so the commas behind one are the value's own`,
			code: `a { b: 1px // c\f,2px ,3px; }`,
			fixed: `a { b: 1px // c\f, 2px , 3px; }`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 17,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 22,
				},
			],
		},
	],
})
