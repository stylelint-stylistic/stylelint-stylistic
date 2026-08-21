import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { background-size: 0 , 0; }`,
			description: `a space on either side of the comma`,
		},
		{
			code: `a { background-size: 0, 0; }`,
			description: `a space after the comma`,
		},
		{
			code: `a::before { content: "foo,bar,baz"; }`,
			description: `commas inside a string, which are no commas of a value list`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `commas inside the arguments of a function, which another rule measures`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			autoStripIndent: true,
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png), url(http://x/z.png); }`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0,0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `no space after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size:\n\t0,  0; }`,
			fixed: `a { background-size:\n\t0, 0; }`,
			description: `two spaces after the comma, in a value that opens on the line below the colon`,
			message: messages.expectedAfter(),
			line: 2,
			column: 3,
		},
		{
			code: `a { background-size: 0,\n0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a newline after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\r\n0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a carriage-return line break after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a tab after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,/*1*/0; }`,
			fixed: `a { background-size: 0, /*1*/0; }`,
			description: `a comment standing right after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,0,0,0; }`,
			fixed: `a { background-size: 0, 0, 0, 0; }`,
			description: `no space after any of the three commas`,
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
			description: `no space after the comma of a custom property`,
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
			description: `no space after any of the seven commas`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			autoStripIndent: true,
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png),url(http://x/z.png); }`,
			fixed: `a { background: url(http://x/y.png), url(http://x/z.png); }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 36,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			autoStripIndent: true,
			description: `a double slash standing in the code of a plain CSS value, which spells no comment`,
			code: `a { b: a//b,2px; }`,
			fixed: `a { b: a//b, 2px; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 12,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { background-size: 0 ,0; }`,
			description: `a space in front of the comma and none after it`,
		},
		{
			code: `a { background-size: 0,0; }`,
			description: `no space on either side of the comma`,
		},
		{
			code: `a::before { content: "foo, bar, baz"; }`,
			description: `commas inside a string, which are no commas of a value list`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `commas inside the arguments of a function, which another rule measures`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0,0; }`,
			description: `a space after the comma`,
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
			description: `two spaces after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\n0; }`,
			fixed: `a { background-size: 0,0; }`,
			description: `a newline after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\r\n0; }`,
			fixed: `a { background-size: 0,0; }`,
			description: `a carriage-return line break after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0,0; }`,
			description: `a tab after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, /*1*/ 0; }`,
			fixed: `a { background-size: 0,/*1*/ 0; }`,
			description: `spaces around a comment standing after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, 0, 0, 0 ; }`,
			fixed: `a { background-size: 0,0,0,0 ; }`,
			description: `a space after each of the three commas`,
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
			description: `a space after the comma of a custom property`,
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
			description: `a space on either side of the comma of a single-line list`,
		},
		{
			code: `a { background-size: 0, 0; }`,
			description: `a space after the comma of a single-line list`,
		},
		{
			code: `a { background-size: 0, 0;\n}`,
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a { background-size: 0, 0;\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
		{
			code: `a { background-size: 0\n,0}`,
			description: `a multi-line list, which this option does not measure`,
		},
		{
			code: `a { background-size: 0\r\n,0}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a::before { content: "foo,bar,baz"; }`,
			description: `commas inside a string, which are no commas of a value list`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `commas inside the arguments of a function, which another rule measures`,
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
			description: `no space after the comma of a single-line list`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,0;\n}`,
			fixed: `a { background-size: 0, 0;\n}`,
			description: `the same list in a multi-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,0;\r\n}`,
			fixed: `a { background-size: 0, 0;\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `two spaces after the comma of a single-line list`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a tab after the comma of a single-line list`,
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
			description: `a space in front of the comma of a single-line list and none after it`,
		},
		{
			code: `a { background-size: 0,0; }`,
			description: `no space on either side of the comma of a single-line list`,
		},
		{
			code: `a { background-size: 0,0;\n}`,
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a { background-size: 0,0;\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
		{
			code: `a { background-size: 0\n,  0}`,
			description: `a multi-line list, which this option does not measure`,
		},
		{
			code: `a { background-size: 0\r\n,  0}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a::before { content: "foo, bar, baz"; }`,
			description: `commas inside a string, which are no commas of a value list`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `commas inside the arguments of a function, which another rule measures`,
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
			description: `a space after the comma of a single-line list`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, 0;\n}`,
			fixed: `a { background-size: 0,0;\n}`,
			description: `the same list in a multi-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, 0;\r\n}`,
			fixed: `a { background-size: 0,0;\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0,0; }`,
			description: `two spaces after the comma of a single-line list`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0,0; }`,
			description: `a tab after the comma of a single-line list`,
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
