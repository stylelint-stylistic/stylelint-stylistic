import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [0],

	accept: [
		{
			description: `a call written on one line, with no empty line to count`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a call broken across lines with no empty line in it`,
			code: `a { transform: translate(\n1\n,\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
		},
		{
			description: `an empty line between the name and the parenthesis, which stands outside the arguments`,
			code: `a { transform: translate\n\n(1, 1); }`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { transform: translate\r\n\r\n(1, 1); }`,
		},
		{
			description: `an empty line behind the call, outside its arguments`,
			code: `a { transform: translate(1, 1)\n\n; }`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { transform: translate(1, 1)\r\n\r\n; }`,
		},
		{
			description: `an empty line in front of the call, outside its arguments`,
			code: `
				a { transform:

				translate(1, 1); }
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { transform:\r\n\r\ntranslate(1, 1); }`,
		},
		{
			description: `an empty line inside a value list, which opens no call`,
			code: `
				a { background: blah,

				foo; }
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { background: blah,\r\n\r\nfoo; }`,
		},
		{
			description: `an SCSS list, whose parentheses open no call`,
			code: `
				$list: (value,


				value2)
			`,
		},
	],

	reject: [
		{
			description: `two empty lines behind a comment that opens the arguments`,
			code: `a { transform: translate(/*c*/\n\n\n1,1); }`,
			fixed: `a { transform: translate(/*c*/\n1,1); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `two empty lines behind the parenthesis, the comment standing in front of the call`,
			code: `
				a { transform: /*c*/translate(


				1,1); }
			`,
			fixed: `
				a { transform: /*c*/translate(
				1,1); }
			`,
			line: 1,
			column: 20,
			message: messages.expected(0),
		},
		{
			description: `an empty line behind the opening parenthesis`,
			code: `a { transform: translate(\n\n1\n,\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `empty lines behind the opening parenthesis and in front of the closing one`,
			code: `a { transform: translate(\n\n1\n,\n1\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `empty lines at both ends and around the comma`,
			code: `a { transform: translate(\n\n1\n\n,\n1\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n\r\n1\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `an empty line in front of the comma`,
			code: `a { transform: translate(\n1\n\n,\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `an empty line behind the comma`,
			code: `a { transform: translate(\n1\n,\n\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `an empty line in front of the closing parenthesis`,
			code: `a { transform: translate(\n1\n,\n1\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
	],
})

testRule({
	ruleName,
	config: [1],

	accept: [
		{
			description: `a call broken across lines with no empty line in it`,
			code: `a { transform: translate(\n1\n,\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
		},
		{
			description: `one empty line behind the opening parenthesis, which is the most the option allows`,
			code: `a { transform: translate(\n\n1\n,\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n\r\n1\r\n,\r\n1\r\n); }`,
		},
		{
			description: `one empty line in front of the comma`,
			code: `a { transform: translate(\n1\n\n,\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n\r\n,\r\n1\r\n); }`,
		},
		{
			description: `one empty line behind the comma`,
			code: `a { transform: translate(\n1\n,\n\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n1\r\n); }`,
		},
		{
			description: `one empty line in front of the closing parenthesis`,
			code: `a { transform: translate(\n1\n,\n1\n\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n); }`,
		},
	],

	reject: [
		{
			description: `two empty lines behind the opening parenthesis`,
			code: `a { transform: translate(\n\n\n1\n,\n1\n); }`,
			fixed: `a { transform: translate(\n\n1\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(1),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n\r\n\r\n1\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n\r\n1\r\n,\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(1),
		},
		{
			description: `two empty lines in front of the comma`,
			code: `a { transform: translate(\n1\n\n\n,\n1\n); }`,
			fixed: `a { transform: translate(\n1\n\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(1),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n\r\n\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n\r\n,\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(1),
		},
		{
			description: `two empty lines behind the comma`,
			code: `a { transform: translate(\n1\n,\n\n\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(1),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(1),
		},
		{
			description: `two empty lines in front of the closing parenthesis`,
			code: `a { transform: translate(\n1\n,\n1\n\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(1),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `a call broken across lines with no empty line in it`,
			code: `a { transform: translate(\n1\n,\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n); }`,
		},
		{
			description: `one empty line behind the opening parenthesis`,
			code: `a { transform: translate(\n\n1\n,\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n\r\n1\r\n,\r\n1\r\n); }`,
		},
		{
			description: `one empty line in front of the comma`,
			code: `a { transform: translate(\n1\n\n,\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n\r\n,\r\n1\r\n); }`,
		},
		{
			description: `one empty line behind the comma`,
			code: `a { transform: translate(\n1\n,\n\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n1\r\n); }`,
		},
		{
			description: `one empty line in front of the closing parenthesis`,
			code: `a { transform: translate(\n1\n,\n1\n\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n); }`,
		},
		{
			description: `two empty lines behind the opening parenthesis, which is the most the option allows`,
			code: `a { transform: translate(\n\n\n1\n,\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n\r\n\r\n1\r\n,\r\n1\r\n); }`,
		},
		{
			description: `two empty lines in front of the comma`,
			code: `a { transform: translate(\n1\n\n\n,\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n\r\n\r\n,\r\n1\r\n); }`,
		},
		{
			description: `two empty lines behind the comma`,
			code: `a { transform: translate(\n1\n,\n\n\n1\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n\r\n1\r\n); }`,
		},
		{
			description: `two empty lines in front of the closing parenthesis`,
			code: `a { transform: translate(\n1\n,\n1\n\n\n); }`,
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n\r\n); }`,
		},
	],

	reject: [
		{
			description: `three empty lines behind the opening parenthesis`,
			code: `a { transform: translate(\n\n\n\n1\n,\n1\n); }`,
			fixed: `a { transform: translate(\n\n\n1\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(2),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n\r\n\r\n\r\n1\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n\r\n\r\n1\r\n,\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(2),
		},
		{
			description: `three empty lines in front of the comma`,
			code: `a { transform: translate(\n1\n\n\n\n,\n1\n); }`,
			fixed: `a { transform: translate(\n1\n\n\n,\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(2),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n\r\n\r\n\r\n,\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n\r\n\r\n,\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(2),
		},
		{
			description: `three empty lines behind the comma`,
			code: `a { transform: translate(\n1\n,\n\n\n\n1\n); }`,
			fixed: `a { transform: translate(\n1\n,\n\n\n1\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(2),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n\r\n\r\n\r\n1\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n\r\n\r\n1\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(2),
		},
		{
			description: `three empty lines in front of the closing parenthesis`,
			code: `a { transform: translate(\n1\n,\n1\n\n\n\n); }`,
			fixed: `a { transform: translate(\n1\n,\n1\n\n\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(2),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n\r\n\r\n); }`,
			fixed: `a { transform: translate(\r\n1\r\n,\r\n1\r\n\r\n\r\n); }`,
			line: 1,
			column: 15,
			message: messages.expected(2),
		},
	],
})
