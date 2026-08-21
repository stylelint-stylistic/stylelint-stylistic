import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a break behind the colon, with the value indented on the next line`,
			code: `
				a {
				  color:
				    pink
				}
			`,
		},
		{
			description: `a space in front of the colon and a break behind it`,
			code: `a { color :\npink }`,
		},
		{
			description: `breaks on both sides of the colon`,
			code: `a { color\n:\npink }`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `a { color\r\n:\r\npink }`,
		},
		{
			description: `empty lines on both sides of the colon`,
			code: `a { color\n\n:\n\npink }`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `a { color\r\n\r\n:\r\n\r\npink }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/196
			description: `a bare carriage return after the colon, which ends a line as readily`,
			code: `a { color:\rpink }`,
		},
		{
			description: `a form feed after the colon, which ends a line to every syntax this plugin reads through`,
			code: `a { color:\fpink }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			description: `a comment behind a form feed, which stands on a line of its own rather than on the colon's, so nothing is asked of the text behind it`,
			code: `a { color:\f/* c */pink }`,
		},
		{
			description: `an SCSS map written on one line, whose inner colon opens no declaration`,
			code: `$map: (key: value)`,
		},
		{
			description: `a data URI, whose own colon opens no declaration either`,
			code: `a { background:\n  url(data:application/font-woff;...); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			description: `spaces in front of a bare carriage return, which the fix trims up to the break rather than writing a line feed in front of them`,
			code: `a { color:  \rpink }`,
			fixed: `a { color:\rpink }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			description: `spaces in front of a form feed, which ends a line to every syntax this plugin reads through`,
			code: `a { color:  \fpink }`,
			fixed: `a { color:\fpink }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			description: `a value abutting the colon`,
			code: `a { color :pink; }`,
			fixed: `a { color :\npink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the colon`,
			code: `a { color :  pink; }`,
			fixed: `a { color :\n  pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the colon`,
			code: `a { color :\tpink; }`,
			fixed: `a { color :\n\tpink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a space behind the colon`,
			code: `a { color : pink; }`,
			fixed: `a { color :\n pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a space in front of the break, which is what the fix trims`,
			code: `a { color : \npink; }`,
			fixed: `a { color :\npink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `the same trailing space in front of a carriage return`,
			code: `a { color : \r\npink; }`,
			fixed: `a { color :\r\npink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a space and a tab in front of the break, and a tab behind it`,
			code: `a { color : \t\n\t\npink; }`,
			fixed: `a { color :\n\t\npink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment abutting the colon`,
			code: `a { color :/*comment*/pink; }`,
			fixed: `a { color :/*comment*/\npink; }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment standing between spaces`,
			code: `a { color : /*comment*/ pink; }`,
			fixed: `a { color : /*comment*/\n pink; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment on the line behind the colon, with the value behind it`,
			code: `a { color : \n/*comment*/ pink; }`,
			fixed: `a { color :\n/*comment*/ pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `several spaces on both sides of the colon`,
			code: `a { color        :    pink; }`,
			fixed: `a { color        :\n    pink; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a single-line declaration, which this option passes over`,
			code: `
				a {
				  color: pink
				}
			`,
		},
		{
			description: `a value broken across lines, with the break behind the colon`,
			code: `a {\n  box-shadow:\n    0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
		},
		{
			description: `an SCSS map broken across lines, with the break behind its outer colon`,
			code: `$map\n: (\nkey: value,\nkey2 :value2)`,
		},
		{
			description: `an SCSS list broken across lines`,
			code: `
				$list: (
				'value1',
				'value2',
				)
			`,
		},
		{
			description: `a single-line declaration whose value abuts the colon`,
			code: `a { color:pink }`,
		},
		{
			description: `a single-line declaration with a tab behind the colon`,
			code: `a { color :\tpink }`,
		},
		{
			description: `a break in front of the colon, which does not make the value multi-line`,
			code: `a { color\n: pink }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color\r\n:  pink }`,
		},
	],

	reject: [
		{
			description: `a value broken across lines with a space behind the colon`,
			code: `a {\n  box-shadow: 0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
			fixed: `a {\n  box-shadow:\n 0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
			line: 2,
			column: 13,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same value abutting the colon`,
			code: `a {\n  box-shadow:0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
			fixed: `a {\n  box-shadow:\n0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
			line: 2,
			column: 13,
			message: messages.expectedAfterMultiLine(),
		},
	],
})
