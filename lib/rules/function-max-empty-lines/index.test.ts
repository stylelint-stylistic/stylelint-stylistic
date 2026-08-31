import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

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
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a call whose name stands behind a double slash, which plain CSS spells no comment with`,
			code: `a { b: f(1) // g(\n\n\n2)\n; }`,
			fixed: `a { b: f(1) // g(\n2)\n; }`,
			line: 1,
			column: 15,
			message: messages.expected(0),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/366
		{
			description: `a call nested in another, both of them holding empty lines`,
			code: `a { b: f(\n\n\ng(\n\n\n1)); }`,
			fixed: `a { b: f(\ng(\n1)); }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expected(0),
				},
				{
					line: 3,
					column: 1,
					message: messages.expected(0),
				},
			],
		},
		{
			description: `the same pair of calls spelled with carriage returns`,
			code: `a { b: f(\r\n\r\n\r\ng(\r\n\r\n\r\n1)); }`,
			fixed: `a { b: f(\r\ng(\r\n1)); }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expected(0),
				},
				{
					line: 3,
					column: 2,
					message: messages.expected(0),
				},
			],
		},
		{
			description: `a nested call with an argument of the outer one standing behind it`,
			code: `a { b: f(\n\n\ng(\n\n\n1), 2); }`,
			fixed: `a { b: f(\ng(\n1), 2); }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expected(0),
				},
				{
					line: 3,
					column: 1,
					message: messages.expected(0),
				},
			],
		},
		{
			description: `a nested call holding every empty line of the pair, the outer one adding none of its own`,
			code: `a { b: f(g(\n\n\n1)); }`,
			fixed: `a { b: f(g(\n1)); }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expected(0),
				},
				{
					line: 1,
					column: 9,
					message: messages.expected(0),
				},
			],
		},
		{
			description: `three calls nested one inside the next, each of them holding empty lines`,
			code: `a { b: f(\n\n\ng(\n\n\nh(\n\n\n1))); }`,
			fixed: `a { b: f(\ng(\nh(\n1))); }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expected(0),
				},
				{
					line: 3,
					column: 1,
					message: messages.expected(0),
				},
				{
					line: 6,
					column: 1,
					message: messages.expected(0),
				},
			],
		},
		{
			description: `two calls standing side by side, neither of which answers for what the other holds`,
			code: `a { b: f(\n\n\n1) g(\n\n\n2); }`,
			fixed: `a { b: f(\n1) g(\n2); }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expected(0),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(0),
				},
			],
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/370
		{
			description: `a comment opening with a solidus, a star and a solidus, standing in front of the empty lines it shares a call with`,
			code: `a { b: f(1 /*/x*/\n\n\n2); }`,
			fixed: `a { b: f(1 /*/x*/\n2); }`,
			line: 1,
			column: 7,
			message: messages.expected(0),
		},
		{
			description: `the same call spelled with carriage returns`,
			code: `a { b: f(1 /*/x*/\r\n\r\n\r\n2); }`,
			fixed: `a { b: f(1 /*/x*/\r\n2); }`,
			line: 1,
			column: 7,
			message: messages.expected(0),
		},
		{
			description: `such a comment standing behind the empty lines instead`,
			code: `a { b: f(1\n\n\n/*/x*/ 2); }`,
			fixed: `a { b: f(1\n/*/x*/ 2); }`,
			line: 1,
			column: 7,
			message: messages.expected(0),
		},
		{
			description: `such a comment with code standing behind the call, whose whitespace the call answers for none of`,
			code: `a { b: f(1 /*/x*/\n\n\n2) zz; }`,
			fixed: `a { b: f(1 /*/x*/\n2) zz; }`,
			line: 1,
			column: 7,
			message: messages.expected(0),
		},
		{
			description: `such a comment inside a nested call, which the fix of the outer one writes over`,
			code: `a { b: f(g(1 /*/x*/\n\n\n2)); }`,
			fixed: `a { b: f(g(1 /*/x*/\n2)); }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expected(0),
				},
				{
					line: 1,
					column: 9,
					message: messages.expected(0),
				},
			],
		},
		{
			description: `such a comment closing on the star it opened with, so that the call its text names is a call of the value`,
			code: `a { b: f(1 /*/g(*/\n\n\n2); }`,
			fixed: `a { b: f(1 /*/g(*/\n2); }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expected(0),
				},
				{
					line: 1,
					column: 14,
					message: messages.expected(0),
				},
			],
		},
		{
			description: `such a comment standing outside every call, where the fix has nothing to do with it`,
			code: `a { b: /*/x*/ f(1\n\n\n2); }`,
			fixed: `a { b: /*/x*/ f(1\n2); }`,
			line: 1,
			column: 14,
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
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/366
		{
			description: `a call nested in another under a higher maximum, both of them holding two empty lines`,
			code: `a { b: f(\n\n\n\ng(\n\n\n\n1)); }`,
			fixed: `a { b: f(\n\ng(\n\n1)); }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expected(1),
				},
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
			],
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
