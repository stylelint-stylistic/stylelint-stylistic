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
			code: `a { background-size: 0 ,0; }`,
			description: `a space in front of the comma`,
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
			code: `a { background: url(http://x/y.png) ,url(http://x/z.png); }`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			description: `no space in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			description: `two spaces in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `a { background-size: 0\n, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			description: `a newline in front of the comma`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { background-size: 0\r\n, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			description: `a carriage-return line break in front of the comma`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			description: `a tab in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0/*comment*/, 0; }`,
			fixed: `a { background-size: 0/*comment*/ , 0; }`,
			description: `a comment standing right in front of the comma`,
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
			description: `no space in front of any of the seven commas`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			autoStripIndent: true,
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png),url(http://x/z.png); }`,
			fixed: `a { background: url(http://x/y.png) ,url(http://x/z.png); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 36,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			autoStripIndent: true,
			description: `two block comments standing side by side, whose delimiters spell a double slash between them and open no comment`,
			code: `a { b: 1px/*x*//*y*/,2px; }`,
			fixed: `a { b: 1px/*x*//*y*/ ,2px; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 21,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			autoStripIndent: true,
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: myurl(//a),2px; }`,
			fixed: `a { b: myurl(//a) ,2px; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 18,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			autoStripIndent: true,
			description: `a double slash inside an address whose second slash opens no comment of its own`,
			code: `a { b: url(a//*b*/),2px; }`,
			fixed: `a { b: url(a//*b*/) ,2px; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 20,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { background-size: 0, 0; }`,
			description: `no space in front of the comma`,
		},
		{
			code: `a { background-size: 0,0; }`,
			description: `no space on either side of the comma`,
		},
		{
			code: `a::before { content: "foo ,bar ,baz"; }`,
			description: `commas inside a string, which are no commas of a value list`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
			description: `commas inside the arguments of a function, which another rule measures`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0 , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a space in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `two spaces in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `a { background-size: 0\n, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a newline in front of the comma`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { background-size: 0\r\n, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a carriage-return line break in front of the comma`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a tab in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0 /*comment*/ , 0; }`,
			fixed: `a { background-size: 0 /*comment*/, 0; }`,
			description: `spaces around a comment standing in front of the comma`,
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
			description: `a space on either side of the comma of a single-line list`,
		},
		{
			code: `a { background-size: 0 ,0; }`,
			description: `a space in front of the comma of a single-line list`,
		},
		{
			code: `a { background-size: 0 ,0;\n}`,
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a { background-size: 0 ,0;\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
		{
			code: `a { background-size: 0,\n0; }`,
			description: `a multi-line list, which this option does not measure`,
		},
		{
			code: `a { background-size: 0,\r\n0; }`,
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
			description: `no space in front of the comma of a single-line list, inside a multi-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, 0;\r\n}`,
			fixed: `a { background-size: 0 , 0;\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			description: `two spaces in front of the comma of a single-line list`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 25,
		},
		{
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			description: `a tab in front of the comma of a single-line list`,
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
			description: `no space in front of the comma of a single-line list`,
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
			code: `a { background-size: 0 ,\n0; }`,
			description: `a multi-line list, which this option does not measure`,
		},
		{
			code: `a { background-size: 0 ,\r\n0; }`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a::before { content: "foo ,bar ,baz"; }`,
			description: `commas inside a string, which are no commas of a value list`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
			description: `commas inside the arguments of a function, which another rule measures`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0 , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a space in front of the comma of a single-line list`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0 , 0;\n}`,
			fixed: `a { background-size: 0, 0;\n}`,
			description: `the same list in a multi-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0 , 0;\r\n}`,
			fixed: `a { background-size: 0, 0;\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `two spaces in front of the comma of a single-line list`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 25,
		},
		{
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			description: `a tab in front of the comma of a single-line list`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a double slash of a syntax that spells a comment with one still opens a comment: the comma in its text is no comma of the value, and the one behind it cannot join the comment's line. This is what the syntax must go on doing, and is a guard rather than a shape the issue names`,
			code: `a { b: 1px // a , b\n,2px; }`,
			fixed: `a { b: 1px // a , b\n,2px; }`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `an inline comment standing behind a bare address is a comment all the same, and the comma cannot join its line`,
			code: `
				a {
					b: url(http://x) // c
					,'y';
				}
			`,
			fixed: `
				a {
					b: url(http://x) // c
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma inside the text of an inline comment behind a bare address is no comma of the value`,
			code: `
				a {
					b: url(http://x), // a , b
						'y';
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/181
			description: `a value spelling an extend, which the syntax marks the declaration as one for`,
			code: `a { b: "extend(x)" ,0; }`,
			fixed: `a { b: "extend(x)",0; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 20,
		},
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
