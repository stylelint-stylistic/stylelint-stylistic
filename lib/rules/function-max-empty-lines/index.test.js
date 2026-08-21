import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [0],

	accept: [
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a call written on one line, with no empty line to count`,
		},
		{
			code: `a { transform: translate(\n1\n,\n1\n); }`,
			description: `a call broken across lines with no empty line in it`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate\n\n(1, 1); }`,
			description: `an empty line between the name and the parenthesis, which stands outside the arguments`,
		},
		{
			code: `a { transform: translate\r\n\r\n(1, 1); }`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(1, 1)\n\n; }`,
			description: `an empty line behind the call, outside its arguments`,
		},
		{
			code: `a { transform: translate(1, 1)\r\n\r\n; }`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `a { transform:\n\ntranslate(1, 1); }`,
			description: `an empty line in front of the call, outside its arguments`,
		},
		{
			code: `a { transform:\r\n\r\ntranslate(1, 1); }`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `a { background: blah,\n\nfoo; }`,
			description: `an empty line inside a value list, which opens no call`,
		},
		{
			code: `a { background: blah,\r\n\r\nfoo; }`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `$list: (value,\n\n\nvalue2)`,
			description: `an SCSS list, whose parentheses open no call`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(/*c*/\n\n\n1,1); }`,
			fixed: `a { transform: translate(/*c*/\n1,1); }`,
			description: `two empty lines behind a comment that opens the arguments`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: /*c*/translate(\n\n\n1,1); }`,
			fixed: `a { transform: /*c*/translate(\n1,1); }`,
			description: `two empty lines behind the parenthesis, the comment standing in front of the call`,
			message: messages.expected(0),
			line: 1,
			column: 20,
		},
		{
			code: `a { transform: translate(\n\n1\n,\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			description: `an empty line behind the opening parenthesis`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n\n1\n,\n1\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			description: `empty lines behind the opening parenthesis and in front of the closing one`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n\n1\n\n,\n1\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			description: `empty lines at both ends and around the comma`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n\r\n1\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n1\n\n,\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			description: `an empty line in front of the comma`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n1\r\n\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n1\n,\n\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			description: `an empty line behind the comma`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n1\n,\n1\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			description: `an empty line in front of the closing parenthesis`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(0),
			line: 1,
			column: 15,
		},
	],
})

testRule({
	ruleName,
	config: [1],

	accept: [
		{
			code: `a { transform: translate(\n1\n,\n1\n); }`,
			description: `a call broken across lines with no empty line in it`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n\n1\n,\n1\n); }`,
			description: `one empty line behind the opening parenthesis, which is the most the option allows`,
		},
		{
			code: `a { transform: translate(\r\n\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n1\n\n,\n1\n); }`,
			description: `one empty line in front of the comma`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n1\n,\n\n1\n); }`,
			description: `one empty line behind the comma`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n1\n,\n1\n\n); }`,
			description: `one empty line in front of the closing parenthesis`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(\n\n\n1\n,\n1\n); }`,
			fixed: `a { transform: translate(\n\n1\n,\n1\n); }`,
			description: `two empty lines behind the opening parenthesis`,
			message: messages.expected(1),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n\r\n\r\n1\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(1),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n1\n\n\n,\n1\n); }`,
			fixed: `a { transform: translate(\n1\n\n,\n1\n); }`,
			description: `two empty lines in front of the comma`,
			message: messages.expected(1),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n1\r\n\r\n\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(1),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n1\n,\n\n\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n\n1\n); }`,
			description: `two empty lines behind the comma`,
			message: messages.expected(1),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(1),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n1\n,\n1\n\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n\n); }`,
			description: `two empty lines in front of the closing parenthesis`,
			message: messages.expected(1),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(1),
			line: 1,
			column: 15,
		},
	],
})

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			code: `a { transform: translate(\n1\n,\n1\n); }`,
			description: `a call broken across lines with no empty line in it`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n\n1\n,\n1\n); }`,
			description: `one empty line behind the opening parenthesis`,
		},
		{
			code: `a { transform: translate(\r\n\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n1\n\n,\n1\n); }`,
			description: `one empty line in front of the comma`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n1\n,\n\n1\n); }`,
			description: `one empty line behind the comma`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n1\n,\n1\n\n); }`,
			description: `one empty line in front of the closing parenthesis`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n\n\n1\n,\n1\n); }`,
			description: `two empty lines behind the opening parenthesis, which is the most the option allows`,
		},
		{
			code: `a { transform: translate(\r\n\r\n\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n1\n\n\n,\n1\n); }`,
			description: `two empty lines in front of the comma`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n\r\n\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n1\n,\n\n\n1\n); }`,
			description: `two empty lines behind the comma`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\n1\n,\n1\n\n\n); }`,
			description: `two empty lines in front of the closing parenthesis`,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n\r\n); }`,
			description: `the same call spelled with carriage returns`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(\n\n\n\n1\n,\n1\n); }`,
			fixed: `a { transform: translate(\n\n\n1\n,\n1\n); }`,
			description: `three empty lines behind the opening parenthesis`,
			message: messages.expected(2),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n\r\n\r\n\r\n1\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n\r\n\r\n1\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(2),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n1\n\n\n\n,\n1\n); }`,
			fixed: `a { transform: translate(\n1\n\n\n,\n1\n); }`,
			description: `three empty lines in front of the comma`,
			message: messages.expected(2),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n1\r\n\r\n\r\n\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n\r\n\r\n,\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(2),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n1\n,\n\n\n\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n\n\n1\n); }`,
			description: `three empty lines behind the comma`,
			message: messages.expected(2),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n\r\n\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n\r\n\r\n1\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(2),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\n1\n,\n1\n\n\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n\n\n); }`,
			description: `three empty lines in front of the closing parenthesis`,
			message: messages.expected(2),
			line: 1,
			column: 15,
		},
		{
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n\r\n\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n\r\n); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expected(2),
			line: 1,
			column: 15,
		},
	],
})
