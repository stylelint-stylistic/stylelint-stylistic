import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { background-size: 0\n,0\n,0; }`,
			description: `a newline in front of every comma`,
		},
		{
			code: `a { background-size: 0\n\n,0\n\n,0; }`,
			description: `two newlines in front of every comma`,
		},
		{
			code: `a { background-size: 0\n,  0\n,\t0; }`,
			description: `a newline in front of each comma, with a space and a tab after them`,
		},
		{
			code: `a { background-size: 0\r\n,  0\r\n,\t0; }`,
			description: `the same value written with carriage-return line breaks`,
		},
		{
			code: `a { background-size: 0\r\n\r\n,  0\r\n,\t0; }`,
			description: `two carriage-return line breaks in front of the first comma`,
		},
		{
			code: `a { background-size: 0\n    ,0\n,0; }`,
			description: `a comma indented under the value it follows`,
		},
		{
			code: `a { background-size: 0\n\t\t,0\n,0; }`,
			description: `the same comma indented with tabs`,
		},
		{
			code: `a { background-size: 0\r\n\t\t,0\r\n,0; }`,
			description: `the same value written with carriage-return line breaks`,
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
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `
				a { background: url(http://x/y.png)
				,url(http://x/z.png); }
			`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0, 0; }`,
			description: `no newline in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background-size: 0 , 0; }`,
			description: `a space in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { background-size: 0  , 0; }`,
			description: `two spaces in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `a { background-size: 0\t, 0; }`,
			description: `a tab in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 24,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png),url(http://x/z.png); }`,
			message: messages.expectedBefore(),
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
			code: `a { background-size: 0\n,0\n,0; }`,
			description: `a newline in front of every comma of a multi-line list`,
		},
		{
			code: `a { background-size: 0\n,  0\n,\t0; }`,
			description: `the same list with a space and a tab after the commas`,
		},
		{
			code: `a { background-size: 0\r\n,  0\r\n,\t0; }`,
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
			code: `a { background-size: 0\n, 0, 0; }`,
			description: `no newline in front of the second comma of a multi-line list`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 4,
		},
		{
			code: `a { background-size: 0\n, 0 , 0; }`,
			description: `a space in front of the third comma of a multi-line list`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 5,
		},
		{
			code: `a { background-size: 0\r\n, 0 , 0; }`,
			description: `the same value written with a carriage-return line break`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 5,
		},
		{
			code: `a { background-size: 0\n, 0\t, 0; }`,
			description: `a tab in front of the third comma`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 5,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a { background-size: 0,\n0,\n0; }`,
			description: `a newline after every comma, which leaves nothing in front of them`,
		},
		{
			code: `a { background-size: 0 ,0; }`,
			description: `a single-line list, which this option does not measure`,
		},
		{
			code: `a { background-size: 0 ,0;\n}`,
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
		},
	],

	reject: [
		{
			code: `a { background-size: 0,\n0\n, 0; }`,
			description: `a newline in front of the second comma of a multi-line list`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
		{
			code: `a { background-size: 0,\r\n0\r\n, 0; }`,
			description: `the same value written with carriage-return line breaks`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
		{
			code: `a { background-size: 0\n,\t0,\n0; }`,
			description: `a newline in front of the first comma of a multi-line list`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 1,
		},
		{
			code: `a { background-size: 0\r\n,\t0,\r\n0; }`,
			description: `the same value written with carriage-return line breaks`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 1,
		},
	],
})
