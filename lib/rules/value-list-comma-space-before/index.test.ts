import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space on either side of the comma`,
			code: `a { background-size: 0 , 0; }`,
		},
		{
			description: `a space in front of the comma`,
			code: `a { background-size: 0 ,0; }`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo,bar,baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png) ,url(http://x/z.png); }`,
		},
	],

	reject: [
		{
			description: `no space in front of the comma`,
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `a { background-size: 0\n, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `a { background-size: 0\r\n, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment standing right in front of the comma`,
			code: `a { background-size: 0/*comment*/, 0; }`,
			fixed: `a { background-size: 0/*comment*/ , 0; }`,
			line: 1,
			column: 34,
			message: messages.expectedBefore(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			code: `a { prop:,0; }`,
			fixed: `a { prop: ,0; }`,
			line: 1,
			column: 10,
			message: messages.expectedBefore(),
		},
		{
			description: `the same, in a custom property`,
			code: `a { --a:,0; }`,
			fixed: `a { --a: ,0; }`,
			line: 1,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `a comma opening the value and another standing in it, each written where its own whitespace stands`,
			code: `a { prop:,0,0; }`,
			fixed: `a { prop: ,0 ,0; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `the same, with a comment standing between the colon and the value`,
			code: `a { prop:/*c*/,0; }`,
			fixed: `a { prop:/*c*/ ,0; }`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of any of the seven commas`,
			code: `a{b: 0,0,0,0,0,0,0,0; }`,
			fixed: `a{b: 0 ,0 ,0 ,0 ,0 ,0 ,0 ,0; }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 9,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 11,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 15,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 17,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 19,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `a comma inside the property name, which the fixer has to leave standing`,
			code: `a { pr,op: 0,0; }`,
			fixed: `a { pr,op: 0 ,0; }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png),url(http://x/z.png); }`,
			fixed: `a { background: url(http://x/y.png) ,url(http://x/z.png); }`,
			line: 1,
			column: 36,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `two block comments standing side by side, whose delimiters spell a double slash between them and open no comment`,
			code: `a { b: 1px/*x*//*y*/,2px; }`,
			fixed: `a { b: 1px/*x*//*y*/ ,2px; }`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: myurl(//a),2px; }`,
			fixed: `a { b: myurl(//a) ,2px; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a double slash inside an address whose second slash opens no comment of its own`,
			code: `a { b: url(a//*b*/),2px; }`,
			fixed: `a { b: url(a//*b*/) ,2px; }`,
			line: 1,
			column: 20,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `no space in front of the comma`,
			code: `a { background-size: 0, 0; }`,
		},
		{
			description: `no space on either side of the comma`,
			code: `a { background-size: 0,0; }`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo ,bar ,baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1 ,1); }`,
		},
	],

	reject: [
		{
			description: `a space in front of the comma`,
			code: `a { background-size: 0 , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 25,
			message: messages.rejectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `a { background-size: 0\n, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `a { background-size: 0\r\n, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
		{
			description: `spaces around a comment standing in front of the comma`,
			code: `a { background-size: 0 /*comment*/ , 0; }`,
			fixed: `a { background-size: 0 /*comment*/, 0; }`,
			line: 1,
			column: 36,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			code: `a { prop: ,0; }`,
			fixed: `a { prop:,0; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same, with more whitespace than a single space`,
			code: `a { prop:  ,0; }`,
			fixed: `a { prop:,0; }`,
			line: 1,
			column: 12,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same, in a custom property`,
			code: `a { --a: ,0; }`,
			fixed: `a { --a:,0; }`,
			line: 1,
			column: 10,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comma opening the value and another standing in it, each written where its own whitespace stands`,
			code: `a { prop: , 0 , 0; }`,
			fixed: `a { prop:, 0, 0; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 15,
					message: messages.rejectedBefore(),
				},
			],
		},
		{
			description: `the same, with a comment standing between the colon and the value`,
			code: `a { prop: /*c*/ ,0; }`,
			fixed: `a { prop: /*c*/,0; }`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a space on either side of the comma of a single-line list`,
			code: `a { background-size: 0 , 0; }`,
		},
		{
			description: `a space in front of the comma of a single-line list`,
			code: `a { background-size: 0 ,0; }`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `a { background-size: 0 ,0;\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0 ,0;\r\n}`,
		},
		{
			description: `a multi-line list, which this option does not measure`,
			code: `a { background-size: 0,\n0; }`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a { background-size: 0,\r\n0; }`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo,bar,baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1,1); }`,
		},
	],

	reject: [
		{
			description: `the message spelled out, since asking the rule for its own text would miss one that says the opposite of what the option asks (see #175)`,
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 23,
			message: `Expected single space before "," in a single-line list (${ruleName})`,
		},
		{
			description: `no space in front of the comma of a single-line list, inside a multi-line block`,
			code: `a { background-size: 0, 0;\n}`,
			fixed: `a { background-size: 0 , 0;\n}`,
			line: 1,
			column: 23,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0, 0;\r\n}`,
			fixed: `a { background-size: 0 , 0;\r\n}`,
			line: 1,
			column: 23,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the comma of a single-line list`,
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 25,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the comma of a single-line list`,
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 24,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			code: `a { prop:,0;\n}`,
			fixed: `a { prop: ,0;\n}`,
			line: 1,
			column: 10,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `no space in front of the comma of a single-line list`,
			code: `a { background-size: 0, 0; }`,
		},
		{
			description: `no space on either side of the comma of a single-line list`,
			code: `a { background-size: 0,0; }`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `a { background-size: 0,0;\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0,0;\r\n}`,
		},
		{
			description: `a multi-line list, which this option does not measure`,
			code: `a { background-size: 0 ,\n0; }`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a { background-size: 0 ,\r\n0; }`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo ,bar ,baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1 ,1); }`,
		},
	],

	reject: [
		{
			description: `a space in front of the comma of a single-line list`,
			code: `a { background-size: 0 , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `a { background-size: 0 , 0;\n}`,
			fixed: `a { background-size: 0, 0;\n}`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0 , 0;\r\n}`,
			fixed: `a { background-size: 0, 0;\r\n}`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the comma of a single-line list`,
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 25,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the comma of a single-line list`,
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			code: `a { prop: ,0;\n}`,
			fixed: `a { prop:,0;\n}`,
			line: 1,
			column: 11,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a comma opening the value, the space the option asks for having nowhere to go but the text of the inline comment in front of it`,
			code: `a { prop: // c\n,0; }`,
			fixed: `a { prop: // c\n,0; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a comma opening the value, the whitespace in front of it holding the break that closes an inline comment, which the fixer has to leave standing`,
			code: `a { prop: // c\n ,0; }`,
			fixed: `a { prop: // c\n ,0; }`,
			line: 2,
			column: 2,
			message: messages.rejectedBefore(),
		},
	],
})
