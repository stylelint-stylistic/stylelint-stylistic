import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `
				a {
				  color:
				    pink
				}
			`,

			description: `a break behind the colon, with the value indented on the next line`,
		},
		{
			code: `a { color :\npink }`,
			description: `a space in front of the colon and a break behind it`,
		},
		{
			code: `a { color\n:\npink }`,
			description: `breaks on both sides of the colon`,
		},
		{
			code: `a { color\r\n:\r\npink }`,
			description: `the same pair spelled with carriage returns`,
		},
		{
			code: `a { color\n\n:\n\npink }`,
			description: `empty lines on both sides of the colon`,
		},
		{
			code: `a { color\r\n\r\n:\r\n\r\npink }`,
			description: `the same pair spelled with carriage returns`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/196
			code: `a { color:\rpink }`,
			description: `a bare carriage return after the colon, which ends a line as readily`,
		},
		{
			code: `a { color:\fpink }`,
			description: `a form feed after the colon, which ends a line to every syntax this plugin reads through`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			code: `a { color:\f/* c */pink }`,
			description: `a comment behind a form feed, which stands on a line of its own rather than on the colon's, so nothing is asked of the text behind it`,
		},
		{
			code: `$map: (key: value)`,
			description: `an SCSS map written on one line, whose inner colon opens no declaration`,
		},
		{
			code: `a { background:\n  url(data:application/font-woff;...); }`,
			description: `a data URI, whose own colon opens no declaration either`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			code: `a { color:  \rpink }`,
			fixed: `a { color:\rpink }`,
			description: `spaces in front of a bare carriage return, which the fix trims up to the break rather than writing a line feed in front of them`,
			message: messages.expectedAfter(),
			line: 1,
			column: 10,
		},
		{
			code: `a { color:  \fpink }`,
			fixed: `a { color:\fpink }`,
			description: `spaces in front of a form feed, which ends a line to every syntax this plugin reads through`,
			message: messages.expectedAfter(),
			line: 1,
			column: 10,
		},
		{
			code: `a { color :pink; }`,
			fixed: `a { color :\npink; }`,
			description: `a value abutting the colon`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :  pink; }`,
			fixed: `a { color :\n  pink; }`,
			description: `two spaces behind the colon`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\tpink; }`,
			fixed: `a { color :\n\tpink; }`,
			description: `a tab behind the colon`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color : pink; }`,
			fixed: `a { color :\n pink; }`,
			description: `a space behind the colon`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color : \npink; }`,
			fixed: `a { color :\npink; }`,
			description: `a space in front of the break, which is what the fix trims`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color : \r\npink; }`,
			fixed: `a { color :\r\npink; }`,
			description: `the same trailing space in front of a carriage return`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color : \t\n\t\npink; }`,
			fixed: `a { color :\n\t\npink; }`,
			description: `a space and a tab in front of the break, and a tab behind it`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :/*comment*/pink; }`,
			fixed: `a { color :/*comment*/\npink; }`,
			description: `a comment abutting the colon`,
			message: messages.expectedAfter(),
			line: 1,
			column: 22,
		},
		{
			code: `a { color : /*comment*/ pink; }`,
			fixed: `a { color : /*comment*/\n pink; }`,
			description: `the same comment standing between spaces`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { color : \n/*comment*/ pink; }`,
			fixed: `a { color :\n/*comment*/ pink; }`,
			description: `a comment on the line behind the colon, with the value behind it`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color        :    pink; }`,
			fixed: `a { color        :\n    pink; }`,
			description: `several spaces on both sides of the colon`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `
				a {
				  color: pink
				}
			`,
			description: `a single-line declaration, which this option passes over`,
		},
		{
			code: `a {\n  box-shadow:\n    0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
			description: `a value broken across lines, with the break behind the colon`,
		},
		{
			code: `$map\n: (\nkey: value,\nkey2 :value2)`,
			description: `an SCSS map broken across lines, with the break behind its outer colon`,
		},
		{
			code: `
				$list: (
				'value1',
				'value2',
				)
			`,
			description: `an SCSS list broken across lines`,
		},
		{
			code: `a { color:pink }`,
			description: `a single-line declaration whose value abuts the colon`,
		},
		{
			code: `a { color :\tpink }`,
			description: `a single-line declaration with a tab behind the colon`,
		},
		{
			code: `a { color\n: pink }`,
			description: `a break in front of the colon, which does not make the value multi-line`,
		},
		{
			code: `a { color\r\n:  pink }`,
			description: `the same break spelled with a carriage return`,
		},
	],

	reject: [
		{
			code: `a {\n  box-shadow: 0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
			fixed: `a {\n  box-shadow:\n 0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
			description: `a value broken across lines with a space behind the colon`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\n  box-shadow:0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
			fixed: `a {\n  box-shadow:\n0 0 0 1px #5b9dd9\n    0 0 2px 1px rgba(30, 140, 190, 0.8);\n}`,
			description: `the same value abutting the colon`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
	],
})
