import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a newline in front of every comma`,
			code: `a { background-size: 0\n,0\n,0; }`,
		},
		{
			description: `two newlines in front of every comma`,
			code: `a { background-size: 0\n\n,0\n\n,0; }`,
		},
		{
			description: `a newline in front of each comma, with a space and a tab after them`,
			code: `a { background-size: 0\n,  0\n,\t0; }`,
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { background-size: 0\r\n,  0\r\n,\t0; }`,
		},
		{
			description: `two carriage-return line breaks in front of the first comma`,
			code: `a { background-size: 0\r\n\r\n,  0\r\n,\t0; }`,
		},
		{
			description: `a comma indented under the value it follows`,
			code: `a { background-size: 0\n    ,0\n,0; }`,
		},
		{
			description: `the same comma indented with tabs`,
			code: `a { background-size: 0\n\t\t,0\n,0; }`,
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { background-size: 0\r\n\t\t,0\r\n,0; }`,
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
			// See #153
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `
				a { background: url(http://x/y.png)
				,url(http://x/z.png); }
			`,
		},
	],

	reject: [
		{
			description: `no newline in front of the comma`,
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0\n, 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedBefore(),
		},
		{
			description: `a space in front of the comma`,
			code: `a { background-size: 0 , 0; }`,
			fixed: `a { background-size: 0\n , 0; }`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0\n  , 0; }`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0\n\t, 0; }`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			// See #153
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png),url(http://x/z.png); }`,
			fixed: `a { background: url(http://x/y.png)\n,url(http://x/z.png); }`,
			line: 1,
			column: 36,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment standing right in front of the comma`,
			code: `a { background-size: 0/*comment*/, 0; }`,
			fixed: `a { background-size: 0/*comment*/\n, 0; }`,
			line: 1,
			column: 34,
			message: messages.expectedBefore(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			code: `a { prop:,0; }`,
			fixed: `a { prop:\n,0; }`,
			line: 1,
			column: 10,
			message: messages.expectedBefore(),
		},
		{
			description: `the same, with a space between the colon and the comma, which becomes the indentation of the comma's line`,
			code: `a { prop: ,0; }`,
			fixed: `a { prop:\n ,0; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			description: `the same, in a custom property`,
			code: `a { --a:,0; }`,
			fixed: `a { --a:\n,0; }`,
			line: 1,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `a comma opening the value and another standing in it, each written where its own whitespace stands`,
			code: `a { prop:,0,0; }`,
			fixed: `a { prop:\n,0\n,0; }`,
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
			fixed: `a { prop:/*c*/\n,0; }`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `a comma inside the property name, which the fixer has to leave standing`,
			code: `a { pr,op: 0,0; }`,
			fixed: `a { pr,op: 0\n,0; }`,
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
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a newline in front of every comma of a multi-line list`,
			code: `a { background-size: 0\n,0\n,0; }`,
		},
		{
			description: `the same list with a space and a tab after the commas`,
			code: `a { background-size: 0\n,  0\n,\t0; }`,
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { background-size: 0\r\n,  0\r\n,\t0; }`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `a { background-size: 0, 0; }`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `a { background-size: 0, 0;\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0, 0;\r\n}`,
		},
	],

	reject: [
		{
			description: `no newline in front of the second comma of a multi-line list`,
			code: `a { background-size: 0\n, 0, 0; }`,
			fixed: `a { background-size: 0\n, 0\n, 0; }`,
			line: 2,
			column: 4,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a space in front of the third comma of a multi-line list`,
			code: `a { background-size: 0\n, 0 , 0; }`,
			fixed: `a { background-size: 0\n, 0\n , 0; }`,
			line: 2,
			column: 5,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same value written with a carriage-return line break`,
			code: `a { background-size: 0\r\n, 0 , 0; }`,
			fixed: `a { background-size: 0\r\n, 0\r\n , 0; }`,
			line: 2,
			column: 5,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a tab in front of the third comma`,
			code: `a { background-size: 0\n, 0\t, 0; }`,
			fixed: `a { background-size: 0\n, 0\n\t, 0; }`,
			line: 2,
			column: 5,
			message: messages.expectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a newline after every comma, which leaves nothing in front of them`,
			code: `
				a { background-size: 0,
				0,
				0; }
			`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `a { background-size: 0 ,0; }`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `a { background-size: 0 ,0;\n}`,
		},
	],

	reject: [
		{
			description: `a newline in front of the second comma of a multi-line list`,
			code: `a { background-size: 0,\n0\n, 0; }`,
			fixed: `a { background-size: 0,\n0, 0; }`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { background-size: 0,\r\n0\r\n, 0; }`,
			fixed: `a { background-size: 0,\r\n0, 0; }`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a newline in front of the first comma of a multi-line list`,
			code: `a { background-size: 0\n,\t0,\n0; }`,
			fixed: `a { background-size: 0,\t0,\n0; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { background-size: 0\r\n,\t0,\r\n0; }`,
			fixed: `a { background-size: 0,\t0,\r\n0; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a newline in front of a comma opening the value of a multi-line list, which stands between the colon and the value`,
			code: `a { prop:\n,0,\n0; }`,
			fixed: `a { prop:,0,\n0; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

// The space twin writes the run in front of the comma too, and the library lists it behind this rule, so its write would be the file's last (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/value-list-comma-space-before": `always` },

	reject: [
		{
			// See #704
			description: `a space in front of the comma, which the twin behind this rule accepts and would take the break back from, so the warning stands and nothing is written`,
			code: `a { b: c ,d }`,
			fixed: `a { b: c ,d }`,
			line: 1,
			column: 10,
			message: messages.expectedBefore(),
		},
	],
})
