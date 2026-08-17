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
			code: `a { background-size: 0 ,0; }`,
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
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `a { background-size: 0\n, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { background-size: 0\r\n, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			description: `CRLF`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0/*comment*/, 0; }`,
			fixed: `a { background-size: 0/*comment*/ , 0; }`,
			description: `comment`,
			message: messages.expectedBefore(),
			line: 1,
			column: 34,
		},
		{
			code: `a{b: 0,0,0,0,0,0,0,0; }`,
			fixed: `a{b: 0 ,0 ,0 ,0 ,0 ,0 ,0 ,0; }`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 9,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 11,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 13,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 15,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 17,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 19,
				},
			],
		},
		{
			code: `a { pr,op: 0,0; }`,
			fixed: `a { pr,op: 0 ,0; }`,
			description: `a comma inside the property name, which the fixer has to leave standing`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 13,
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
			code: `a { background-size: 0, 0; }`,
		},
		{
			code: `a { background-size: 0,0; }`,
		},
		{
			code: `a::before { content: "foo ,bar ,baz"; }`,
			description: `strings`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
			description: `function arguments`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0 , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `a { background-size: 0\n, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { background-size: 0\r\n, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `CRLF`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0 /*comment*/ , 0; }`,
			fixed: `a { background-size: 0 /*comment*/, 0; }`,
			description: `comment`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 36,
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
			code: `a { background-size: 0 ,0; }`,
		},
		{
			code: `a { background-size: 0 ,0;\n}`,
			description: `single-line list, multi-line block`,
		},
		{
			code: `a { background-size: 0 ,0;\r\n}`,
			description: `single-line list, multi-line block with CRLF`,
		},
		{
			code: `a { background-size: 0,\n0; }`,
			description: `ignores multi-line list`,
		},
		{
			code: `a { background-size: 0,\r\n0; }`,
			description: `ignores multi-line list with CRLF`,
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
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, 0;\n}`,
			fixed: `a { background-size: 0 , 0;\n}`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, 0;\r\n}`,
			fixed: `a { background-size: 0 , 0;\r\n}`,
			description: `CRLF`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 25,
		},
		{
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a { background-size: 0, 0; }`,
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
			code: `a { background-size: 0 ,\n0; }`,
			description: `ignores multi-line list`,
		},
		{
			code: `a { background-size: 0 ,\r\n0; }`,
			description: `ignores multi-line list with CRLF`,
		},
		{
			code: `a::before { content: "foo ,bar ,baz"; }`,
			description: `strings`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
			description: `function arguments`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0 , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0 , 0;\n}`,
			fixed: `a { background-size: 0, 0;\n}`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0 , 0;\r\n}`,
			fixed: `a { background-size: 0, 0;\r\n}`,
			description: `CRLF`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 25,
		},
		{
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/136
			description: `inline comment before the comma: the comma cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					b: 'x' // c
					,'y';
				}
			`,
			fixed: `
				a {
					b: 'x' // c
					,'y';
				}
			`,
			message: messages.expectedBefore(),
			line: 3,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/136
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `
				a {
					b: 'x', // a , b
						'y';
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/136
			description: `inline comment before the comma: the comma cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					b: 'x' // c
					,'y';
				}
			`,
			fixed: `
				a {
					b: 'x' // c
					,'y';
				}
			`,
			message: messages.rejectedBefore(),
			line: 3,
			column: 2,
		},
	],
})
