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
			code: `a { prop:,0; }`,
			fixed: `a { prop: ,0; }`,
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			message: messages.expectedBefore(),
			line: 1,
			column: 10,
		},
		{
			code: `a { --a:,0; }`,
			fixed: `a { --a: ,0; }`,
			description: `the same, in a custom property`,
			message: messages.expectedBefore(),
			line: 1,
			column: 9,
		},
		{
			code: `a { prop:,0,0; }`,
			fixed: `a { prop: ,0 ,0; }`,
			description: `a comma opening the value and another standing in it, each written where its own whitespace stands`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 10,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 12,
				},
			],
		},
		{
			code: `a { prop:/*c*/,0; }`,
			fixed: `a { prop:/*c*/ ,0; }`,
			description: `the same, with a comment standing between the colon and the value`,
			message: messages.expectedBefore(),
			line: 1,
			column: 15,
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
		{
			code: `a { prop: ,0; }`,
			fixed: `a { prop:,0; }`,
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { prop:  ,0; }`,
			fixed: `a { prop:,0; }`,
			description: `the same, with more whitespace than a single space`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 12,
		},
		{
			code: `a { --a: ,0; }`,
			fixed: `a { --a:,0; }`,
			description: `the same, in a custom property`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 10,
		},
		{
			code: `a { prop: , 0 , 0; }`,
			fixed: `a { prop:, 0, 0; }`,
			description: `a comma opening the value and another standing in it, each written where its own whitespace stands`,
			warnings: [
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 11,
				},
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 15,
				},
			],
		},
		{
			code: `a { prop: /*c*/ ,0; }`,
			fixed: `a { prop: /*c*/,0; }`,
			description: `the same, with a comment standing between the colon and the value`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
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
			description: `the message spelled out, since asking the rule for its own text would miss one that says the opposite of what the option asks (see #175)`,
			message: `Expected single space before "," in a single-line list (${ruleName})`,
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
		{
			code: `a { prop:,0;\n}`,
			fixed: `a { prop: ,0;\n}`,
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 10,
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
		{
			code: `a { prop: ,0;\n}`,
			fixed: `a { prop:,0;\n}`,
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 11,
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

	reject: [
		{
			code: `a { prop: // c\n ,0; }`,
			fixed: `a { prop: // c\n ,0; }`,
			description: `a comma opening the value, the whitespace in front of it holding the break that closes an inline comment, which the fixer has to leave standing`,
			message: messages.rejectedBefore(),
			line: 2,
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

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			code: `a { prop: // c\n,0; }`,
			fixed: `a { prop: // c\n,0; }`,
			description: `a comma opening the value, the space the option asks for having nowhere to go but the text of the inline comment in front of it`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			code: `a { prop: // c\n ,0; }`,
			fixed: `a { prop: // c\n ,0; }`,
			description: `a comma opening the value, the whitespace in front of it holding the break that closes an inline comment, which the fixer has to leave standing`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 2,
		},
	],
})
