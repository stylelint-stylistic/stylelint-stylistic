import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

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
			description: `an SCSS map written on one line, whose inner colon opens no declaration`,
			code: `$map: (key: value)`,
		},
		{
			description: `a data URI, whose own colon opens no declaration either`,
			code: `a { background:\n  url(data:application/font-woff;...); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `a break behind the colon, in front of a value that is nothing but a flag`,
			code: `a { color:\n!important; }`,
		},
		{
			description: `the same flag behind a comment standing on the colon's own line, with the break behind that comment`,
			code: `a { color: /*comment*/\n\t!important; }`,
		},
		{
			description: `a break behind the colon, in front of no value at all`,
			code: `a { color:\n; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/408
			description: `a data URI behind whitespace wide enough to have carried the walk past the URI's own colon`,
			code: `a { background  :\n        url(data:x); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/499
			description: `a comment holding a colon of its own on the line behind the colon, whose break is where it is asked for`,
			code: `a { b:\n/*x:y*/ red; }`,
		},
		{
			description: `two comments holding a colon apiece in front of the colon, with the break behind it`,
			code: `a { b /*x:y*/ /*z:w*/:\n red; }`,
		},
	],

	reject: [
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `a space behind the colon, in front of a value that is nothing but a flag`,
			code: `a { color: !important; }`,
			fixed: `a { color:\n !important; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			description: `the same flag abutting the colon`,
			code: `a { color:!important; }`,
			fixed: `a { color:\n!important; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			description: `the same flag behind a comment standing on the colon's own line, which the break is asked of rather than of the colon`,
			code: `a { color: /*comment*/\t!important; }`,
			fixed: `a { color: /*comment*/\n\t!important; }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the colon, in front of no value at all`,
			code: `a { color:  ; }`,
			fixed: `a { color:\n  ; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/400
			description: `a comment opened as \`/*/\`, whose own solidus is no end of it, in front of a value with a word of its own`,
			code: `a { color: /*/ c */pink; }`,
			fixed: `a { color: /*/ c */\npink; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment in front of a value that holds no word of its own`,
			code: `a { color: /*/ c */!important; }`,
			fixed: `a { color: /*/ c */\n!important; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/408
			description: `the same wide whitespace with no break in it: the declaration's own colon is reported and the URI's is not`,
			code: `a { background  :        url(data:x); }`,
			fixed: `a { background  :\n        url(data:x); }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/421
			description: `a property spelling a colon of its own, escaped, in front of a value opening on a comment: the break goes behind the comment rather than into its text`,
			code: `a { b\\:c:/*c*/pink; }`,
			fixed: `a { b\\:c:/*c*/\npink; }`,
			line: 1,
			column: 14,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/388
			description: `a comment holding a colon of its own in front of the declaration's, with two spaces behind that one`,
			code: `a { b/*x:y*/:  x; }`,
			fixed: `a { b/*x:y*/:\n  x; }`,
			line: 1,
			column: 13,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment on the colon's own line, which the break is asked behind`,
			code: `a { b: /*x:y*/ red; }`,
			fixed: `a { b: /*x:y*/\n red; }`,
			line: 1,
			column: 14,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment abutting the colon of a custom property`,
			code: `a { --b:/*x:y*/ red; }`,
			fixed: `a { --b:/*x:y*/\n red; }`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `a string holding a colon of its own in front of the colon`,
			code: `a { b "x:":pink; }`,
			fixed: `a { b "x:":\npink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a parenthesised group standing in front of the colon, which the tokenizer takes whole, so the colon inside it opens no declaration`,
			code: `a { b (x:y):pink; }`,
			fixed: `a { b (x:y):\npink; }`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `a group holding a slash behind a property named after the address call, which the tokenizer takes whole whatever stands inside it`,
			code: `a { url (x/y:z):pink; }`,
			fixed: `a { url (x/y:z):\npink; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment whose text ends in a backslash in front of the colon, which closes on the first delimiter behind its opening as it does to PostCSS`,
			code: `a { b/*x\\*/: red; }`,
			fixed: `a { b/*x\\*/:\n red; }`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/196
			description: `a form feed after the colon, which is whitespace and no line break, so the value is single-line and none of this option's business`,
			code: `a { color:\fpink }`,
		},
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `a break behind the colon of a multi-line declaration whose value holds no word of its own`,
			code: `a { color:\n/*comment*/\t!important; }`,
		},
		{
			description: `the same value with the break standing behind the comment, which is where this option asks for it`,
			code: `a { color:  /*c*/\n/*d*/\t!important; }`,
		},
		{
			description: `a comment holding a colon of its own on the line behind the colon of a multi-line declaration`,
			code: `a { b:\n/*x:y*/ red\n blue; }`,
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
