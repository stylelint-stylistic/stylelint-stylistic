import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { background-size: 0,\n0; }`,
			description: `a newline after the comma`,
		},
		{
			code: `a { background-size: 0,\n\n0; }`,
			description: `two newlines after the comma`,
		},
		{
			code: `a { background-size: 0 ,\n  0; }`,
			description: `a space in front of the comma and a newline with indentation after it`,
		},
		{
			code: `a { background-size: 0 ,\r\n  0; }`,
			description: `the same value written with a carriage-return line break`,
		},
		{
			code: `a { background-size: 0 ,\r\n\r\n  0; }`,
			description: `two carriage-return line breaks after the comma`,
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
			code: `$grid-breakpoints: (\n(xs),\n(sm, 768px)\n) !default;`,
			description: `an SCSS map, whose inner commas the rule does not measure`,
		},
		{
			code: `a { background-size: 0, //\n0; }`,
			description: `an end-of-line comment standing between the comma and the newline`,
		},
		{
			code: `a { background-size: 0, /**/\n0; }`,
			description: `a block comment standing between the comma and the newline`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address in front of the comma, whose double slash opens no comment`,
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
			description: `a space after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0,\n  0; }`,
			description: `two spaces after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0,\n\t0; }`,
			description: `a tab after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0, /**/0; }`,
			fixed: `a { background-size: 0, /**/\n0; }`,
			message: messages.expectedAfter(),
			description: `a comment standing right after the comma, with no newline behind it`,
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
			description: `a newline after every comma of a multi-line list`,
		},
		{
			code: `a { background-size: 0, //\n0, /**/\n0; }`,
			description: `comments standing between the commas and the newlines`,
		},
		{
			code: `a { background-size: 0 ,\n  0,\n0; }`,
			description: `a space in front of the first comma and indentation after it`,
		},
		{
			code: `a { background-size: 0 ,\r\n  0,\r\n0; }`,
			description: `the same value written with carriage-return line breaks`,
		},
		{
			code: `a { background-size: 0, 0; }`,
			description: `a single-line list, which this option does not measure`,
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
			code: `a { background-size: 0, /**/ 0; }`,
			description: `a single-line list carrying a comment, inside a multi-line block`,
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
			description: `a space after the second comma of a multi-line list`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `a { background-size: 0, //\n0, /**/0; }`,
			fixed: `a { background-size: 0, //\n0, /**/\n0; }`,
			description: `a comment standing right after the second comma, with no newline behind it`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 7,
		},
		{
			code: `a { background-size: 0,\n0,  0; }`,
			fixed: `a { background-size: 0,\n0,\n  0; }`,
			description: `two spaces after the second comma`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `a { background-size: 0,\n0,\t0; }`,
			fixed: `a { background-size: 0,\n0,\n\t0; }`,
			description: `a tab after the second comma`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `a { background-size: 0,\r\n0,\t0; }`,
			fixed: `a { background-size: 0,\r\n0,\r\n\t0; }`,
			description: `the same value written with a carriage-return line break`,
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
			description: `a newline in front of every comma, which leaves nothing after them`,
		},
		{
			code: `a { background-size: 0 //\n,0 /**/\n,0; }`,
			description: `comments standing in front of the newlines that precede the commas`,
		},
		{
			code: `a { background-size: 0\r\n,0\r\n,0; }`,
			description: `the same value written with carriage-return line breaks`,
		},
		{
			code: `a { background-size: 0, 0; }`,
			description: `a single-line list, which this option does not measure`,
		},
		{
			code: `a { background-size: 0, 0;\n}`,
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a { background-size: 0, 0;\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
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
			description: `a space after the last comma of a multi-line list`,
			message: messages.rejectedAfterMultiLine(),
			line: 3,
			column: 1,
		},
		{
			code: `a { background-size: 0\n,0\n,  0; }`,
			fixed: `a { background-size: 0\n,0\n,0; }`,
			description: `two spaces after the last comma`,
			message: messages.rejectedAfterMultiLine(),
			line: 3,
			column: 1,
		},
		{
			code: `a { background-size: 0\r\n,0\r\n,  0; }`,
			fixed: `a { background-size: 0\r\n,0\r\n,0; }`,
			description: `the same value written with carriage-return line breaks`,
			message: messages.rejectedAfterMultiLine(),
			line: 3,
			column: 1,
		},
		{
			code: `a { background-size: 0\n,0\n,\t0; }`,
			fixed: `a { background-size: 0\n,0\n,0; }`,
			description: `a tab after the last comma`,
			message: messages.rejectedAfterMultiLine(),
			line: 3,
			column: 1,
		},
	],
})
