import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [0],

	accept: [
		{
			description: `a value written on one line`,
			code: `a { padding: 10px 10px 10px 10px }`,
		},
		{
			description: `a value opening on the line below the colon`,
			code: `a { padding:\n10px 10px 10px 10px }`,
		},
		{
			description: `a blank line between the colon and the value, which belongs to the declaration rather than to the value`,
			code: `
				a { padding:

				10px 10px 10px 10px }
			`,
		},
		{
			description: `the same declaration written with a carriage-return line break`,
			code: `a { padding:\r\n10px 10px 10px 10px }`,
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `a { padding:\r\n\r\n10px 10px 10px 10px }`,
		},
		{
			description: `a newline between the value and the closing brace`,
			code: `a { padding: 10px 10px 10px 10px\n }`,
		},
		{
			description: `the same block written with a carriage-return line break`,
			code: `a { padding: 10px 10px 10px 10px\r\n }`,
		},
		{
			description: `a blank line between the value and the closing brace, which belongs to the block`,
			code: `
				a { padding: 10px 10px 10px 10px

				 }
			`,
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `a { padding: 10px 10px 10px 10px\r\n\r\n }`,
		},
		{
			description: `a value broken over four lines, with no blank line among them`,
			code: `a { padding: 10px\n10px\n10px\n10px }`,
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { padding: 10px\r\n10px\r\n10px\r\n10px }`,
		},
		{
			description: `a two-part value written on one line`,
			code: `a { box-shadow: inset 0 2px 0 #dcffa6, 0 2px 5px #000; }`,
		},
		{
			description: `a two-part value broken after the comma`,
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\n0 2px 5px #000; }`,
		},
		{
			description: `the same value written with a carriage-return line break`,
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n0 2px 5px #000; }`,
		},
		// A run of breaks inside a comment is text of the comment, and collapsing it would carry lines out of the file
		{
			description: `blank lines inside the text of a comment, which are no blank lines of the value`,
			code: `a { padding: 10px /*\n\n\n\n\n\n*/ 10px 10px 10px }`,
		},
		{
			description: `the same comment written with carriage-return line breaks`,
			code: `a { padding: 10px /*\r\n\r\n\r\n\r\n\r\n\r\n*/ 10px 10px 10px }`,
		},
	],

	reject: [
		{
			description: `an empty line whose two breaks are spelled a line feed and then a Windows pair, which is one empty line to PostCSS and none to a search for either spelling alone`,
			code: `a { padding: 10px\n\r\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `three empty lines spelled a line feed and then Windows pairs, cut to the first break as it is spelled`,
			code: `a { padding: 10px\n\r\n\r\n\r\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		// The run inside the comment stands where it was while the one behind it is collapsed
		{
			description: `a blank line of the value behind a comment whose text holds blank lines of its own`,
			code: `a { padding: 10px /*\n\n\n*/\n\n10px 10px 10px }`,
			fixed: `a { padding: 10px /*\n\n\n*/\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `a blank line inside the value`,
			code: `a { padding: 10px\n\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `a { padding: 10px\r\n\r\n10px 10px 10px }`,
			fixed: `a { padding: 10px\r\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `a blank line in front of the last part of the value`,
			code: `a { padding: 10px 10px 10px\n\n10px }`,
			fixed: `a { padding: 10px 10px 10px\n10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `a { padding: 10px 10px 10px\r\n\r\n10px }`,
			fixed: `a { padding: 10px 10px 10px\r\n10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `a blank line after the comma of a two-part value`,
			code: `
				a { box-shadow: inset 0 2px 0 #dcffa6,

				0 2px 5px #000; }
			`,
			fixed: `
				a { box-shadow: inset 0 2px 0 #dcffa6,
				0 2px 5px #000; }
			`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n\r\n0 2px 5px #000; }`,
			fixed: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n0 2px 5px #000; }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `a long run of blank lines inside the value`,
			code: `a { padding: 10px\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `blank lines at three places in one value`,
			code: `a { padding: 10px\n\n\n\n10px\n\n\n10px\n\n10px }`,
			fixed: `a { padding: 10px\n10px\n10px\n10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { padding: 10px\r\n\r\n\r\n\r\n10px\r\n\r\n\r\n10px\r\n\r\n10px }`,
			fixed: `a { padding: 10px\r\n10px\r\n10px\r\n10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `a blank line in front of a comment standing inside the value`,
			code: `
				a { padding: 10px

				 /*comment*/ 10px 10px 10px }
			`,
			fixed: `
				a { padding: 10px
				 /*comment*/ 10px 10px 10px }
			`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `a { padding: 10px\r\n\r\n /*comment*/ 10px 10px 10px }`,
			fixed: `a { padding: 10px\r\n /*comment*/ 10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
		{
			description: `blank lines carrying spaces and a tab`,
			code: `a { padding: 10px\n\n \n\n\t\n\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n \n\t\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(0),
		},
	],
})

testRule({
	ruleName,
	config: [1],

	accept: [
		{
			description: `one empty line spelled a line feed and then a Windows pair, which is the most the option allows`,
			code: `a { padding: 10px\n\r\n10px 10px 10px }`,
		},
		{
			description: `a value broken over four lines, with no blank line among them`,
			code: `a { padding: 10px\n10px\n10px\n10px }`,
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { padding: 10px\r\n10px\r\n10px\r\n10px }`,
		},
		{
			description: `one blank line between every pair of parts`,
			code: `a { padding: 10px\n\n10px\n\n10px\n\n10px }`,
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { padding: 10px\r\n\r\n10px\r\n\r\n10px\r\n\r\n10px }`,
		},
		{
			description: `a two-part value written on one line`,
			code: `a { box-shadow: inset 0 2px 0 #dcffa6, 0 2px 5px #000; }`,
		},
		{
			description: `one blank line after the comma of a two-part value`,
			code: `
				a { box-shadow: inset 0 2px 0 #dcffa6,

				0 2px 5px #000; }
			`,
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n\r\n0 2px 5px #000; }`,
		},
	],

	reject: [
		{
			description: `two empty lines spelled a line feed and then Windows pairs, cut to the first two breaks as they are spelled`,
			code: `a { padding: 10px\n\r\n\r\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n\r\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside the value`,
			code: `a { padding: 10px\n\n\n10px 10px 10px }`,
			fixed: `a { padding: 10px\n\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a { padding: 10px\r\n\r\n\r\n10px 10px 10px }`,
			fixed: `a { padding: 10px\r\n\r\n10px 10px 10px }`,
			line: 1,
			column: 5,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of the last part of the value`,
			code: `a { padding: 10px 10px 10px\n\n\n10px }`,
			fixed: `a { padding: 10px 10px 10px\n\n10px }`,
			line: 1,
			column: 5,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a { padding: 10px 10px 10px\r\n\r\n\r\n10px }`,
			fixed: `a { padding: 10px 10px 10px\r\n\r\n10px }`,
			line: 1,
			column: 5,
			message: messages.expected(1),
		},
		{
			description: `two blank lines after the comma of a two-part value`,
			code: `
				a { box-shadow: inset 0 2px 0 #dcffa6,


				0 2px 5px #000; }
			`,
			fixed: `
				a { box-shadow: inset 0 2px 0 #dcffa6,

				0 2px 5px #000; }
			`,
			line: 1,
			column: 5,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n\r\n\r\n0 2px 5px #000; }`,
			fixed: `a { box-shadow: inset 0 2px 0 #dcffa6,\r\n\r\n0 2px 5px #000; }`,
			line: 1,
			column: 5,
			message: messages.expected(1),
		},
	],
})
