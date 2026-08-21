import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [0],

	accept: [
		{
			code: `a { padding: 10px 10px 10px 10px }`,
			description: `a value written on one line`,
		},
		{
			code: `a { padding:\n10px 10px 10px 10px }`,
			description: `a value opening on the line below the colon`,
		},
		{
			code: `
				a { padding:

				10px 10px 10px 10px }
			`,
			description: `a blank line between the colon and the value, which belongs to the declaration rather than to the value`,
		},
		{
			code: `a { padding:\r\n10px 10px 10px 10px }`,
			description: `the same declaration written with a carriage-return line break`,
		},
		{
			code: `a { padding:\r\n\r\n10px 10px 10px 10px }`,
			description: `the same blank line written with carriage-return line breaks`,
		},
		{
			code: `a { padding: 10px 10px 10px 10px\n }`,
			description: `a newline between the value and the closing brace`,
		},
		{
			code: `a { padding: 10px 10px 10px 10px\r\n }`,
			description: `the same block written with a carriage-return line break`,
		},
		{
			code: `
				a { padding: 10px 10px 10px 10px

				 }
			`,
			description: `a blank line between the value and the closing brace, which belongs to the block`,
		},
		{
			code: `a { padding: 10px 10px 10px 10px\r\n\r\n }`,
			description: `the same blank line written with carriage-return line breaks`,
		},
		{
			code: `a { padding: 10px\n10px\n10px\n10px }`,
			description: `a value broken over four lines, with no blank line among them`,
		},
		{
			code: `a { padding: 10px\r\n10px\r\n10px\r\n10px }`,
			description: `the same value written with carriage-return line breaks`,
		},
		{
			code: `a { box-shadow: inset 0 2px 0 #dcffa6, 0 2px 5px #000; }`,
			description: `a two-part value written on one line`,
		},
		{
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\n0 2px 5px #000; }`,
			description: `a two-part value broken after the comma`,
		},
		{
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n0 2px 5px #000; }`,
			description: `the same value written with a carriage-return line break`,
		},
	],

	reject: [
		{
			code: `a { padding: 10px /*\n\n\n\n\n\n*/ 10px 10px 10px }`,
			fixed: `a { padding: 10px /*\n*/ 10px 10px 10px }`,
			description: `blank lines inside a comment, which the rule counts like any others`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px\n\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n10px 10px 10px }`,
			description: `a blank line inside the value`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px\r\n\r\n10px 10px 10px }`,
			fixed: `a { padding: 10px\r\n10px 10px 10px }`,
			description: `the same blank line written with carriage-return line breaks`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px 10px 10px\n\n10px }`,
			fixed: `a { padding: 10px 10px 10px\n10px }`,
			description: `a blank line in front of the last part of the value`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px 10px 10px\r\n\r\n10px }`,
			fixed: `a { padding: 10px 10px 10px\r\n10px }`,
			description: `the same blank line written with carriage-return line breaks`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `
				a { box-shadow: inset 0 2px 0 #dcffa6,

				0 2px 5px #000; }
			`,
			fixed: `
				a { box-shadow: inset 0 2px 0 #dcffa6,
				0 2px 5px #000; }
			`,
			description: `a blank line after the comma of a two-part value`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n\r\n0 2px 5px #000; }`,
			fixed: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n0 2px 5px #000; }`,
			description: `the same blank line written with carriage-return line breaks`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n10px 10px 10px }`,
			description: `a long run of blank lines inside the value`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px\n\n\n\n10px\n\n\n10px\n\n10px }`,
			fixed: `a { padding: 10px\n10px\n10px\n10px }`,
			description: `blank lines at three places in one value`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px\r\n\r\n\r\n\r\n10px\r\n\r\n\r\n10px\r\n\r\n10px }`,
			fixed: `a { padding: 10px\r\n10px\r\n10px\r\n10px }`,
			description: `the same value written with carriage-return line breaks`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `
				a { padding: 10px

				 /*comment*/ 10px 10px 10px }
			`,
			fixed: `
				a { padding: 10px
				 /*comment*/ 10px 10px 10px }
			`,
			description: `a blank line in front of a comment standing inside the value`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px\r\n\r\n /*comment*/ 10px 10px 10px }`,
			fixed: `a { padding: 10px\r\n /*comment*/ 10px 10px 10px }`,
			description: `the same blank line written with carriage-return line breaks`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px\n\n \n\n\t\n\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n \n\t\n10px 10px 10px }`,
			description: `blank lines carrying spaces and a tab`,
			message: messages.expected(0),
			line: 1,
			column: 5,
		},
	],
})

testRule({
	ruleName,
	config: [1],

	accept: [
		{
			code: `a { padding: 10px\n10px\n10px\n10px }`,
			description: `a value broken over four lines, with no blank line among them`,
		},
		{
			code: `a { padding: 10px\r\n10px\r\n10px\r\n10px }`,
			description: `the same value written with carriage-return line breaks`,
		},
		{
			code: `a { padding: 10px\n\n10px\n\n10px\n\n10px }`,
			description: `one blank line between every pair of parts`,
		},
		{
			code: `a { padding: 10px\r\n\r\n10px\r\n\r\n10px\r\n\r\n10px }`,
			description: `the same value written with carriage-return line breaks`,
		},
		{
			code: `a { box-shadow: inset 0 2px 0 #dcffa6, 0 2px 5px #000; }`,
			description: `a two-part value written on one line`,
		},
		{
			code: `
				a { box-shadow: inset 0 2px 0 #dcffa6,

				0 2px 5px #000; }
			`,
			description: `one blank line after the comma of a two-part value`,
		},
		{
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n\r\n0 2px 5px #000; }`,
			description: `the same blank line written with carriage-return line breaks`,
		},
	],

	reject: [
		{
			code: `a { padding: 10px\n\n\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n\n10px 10px 10px }`,
			description: `two blank lines inside the value`,
			message: messages.expected(1),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px\r\n\r\n\r\n10px 10px 10px }`,
			fixed: `a { padding: 10px\r\n\r\n10px 10px 10px }`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(1),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px 10px 10px\n\n\n10px }`,
			fixed: `a { padding: 10px 10px 10px\n\n10px }`,
			description: `two blank lines in front of the last part of the value`,
			message: messages.expected(1),
			line: 1,
			column: 5,
		},
		{
			code: `a { padding: 10px 10px 10px\r\n\r\n\r\n10px }`,
			fixed: `a { padding: 10px 10px 10px\r\n\r\n10px }`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(1),
			line: 1,
			column: 5,
		},
		{
			code: `
				a { box-shadow: inset 0 2px 0 #dcffa6,


				0 2px 5px #000; }
			`,
			fixed: `
				a { box-shadow: inset 0 2px 0 #dcffa6,

				0 2px 5px #000; }
			`,
			description: `two blank lines after the comma of a two-part value`,
			message: messages.expected(1),
			line: 1,
			column: 5,
		},
		{
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n\r\n\r\n0 2px 5px #000; }`,
			fixed: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n\r\n0 2px 5px #000; }`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(1),
			line: 1,
			column: 5,
		},
	],
})
