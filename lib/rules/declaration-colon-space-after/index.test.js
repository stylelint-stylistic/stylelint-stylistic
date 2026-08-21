import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a custom property whose value is a single space`,
			code: `a { --a: ; }`,
		},
		{
			description: `the same custom property with a declaration behind it`,
			code: `a { --a: ; color: red; }`,
		},
		{
			description: `a space behind the colon`,
			code: `a { color: pink }`,
		},
		{
			description: `spaces on both sides of the colon`,
			code: `a { color : pink }`,
		},
		{
			description: `a break in front of the colon and a space behind it`,
			code: `a { color\n: pink }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color\r\n: pink }`,
		},
		{
			description: `an SCSS map written on one line, whose inner colon opens no declaration`,
			code: `$map:(key:value)`,
		},
		{
			description: `an SCSS list written on one line`,
			code: `$list:('value1', 'value2')`,
		},
		{
			description: `a data URI, whose own colon opens no declaration either`,
			code: `a { background: url(data:application/font-woff;...); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `comment with an URL, space after the declaration's own colon`,
			code: `a { color/* https://foo.bar/ */: pink; }`,
		},
		{
			description: `a custom property holding nothing but a comment`,
			code: `a { --a: /*comment*/; }`,
		},
		{
			description: `the same custom property with no semicolon behind it`,
			code: `a { --a: /*comment*/ }`,
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a: /*comment*/ !important; }`,
		},
		{
			description: `a value and a comment behind the colon`,
			code: `a { --a: red /*comment*/; }`,
		},
		{
			description: `the same comment and flag, with a space in front of the colon`,
			code: `a { --a : /*comment*/ !important; }`,
		},
		{
			description: `the same comment behind a colon that stands behind a tab`,
			code: `a { --a\t: /*comment*/; }`,
		},
	],

	reject: [
		{
			description: `a custom property with no value at all`,
			code: `a { --a:; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `a custom property whose value is two spaces`,
			code: `a { --a:  ; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same empty custom property in a block broken across lines`,
			code: `
				a {
					--a:;
				}
			`,
			fixed: `
				a {
					--a: ;
				}
			`,
			line: 2,
			column: 6,
			message: messages.expectedAfter(),
		},
		{
			description: `the same two spaces in a block broken across lines`,
			code: `
				a {
					--a:  ;
				}
			`,
			fixed: `
				a {
					--a: ;
				}
			`,
			line: 2,
			column: 6,
			message: messages.expectedAfter(),
		},
		{
			description: `a custom property whose value is a break`,
			code: `
				a {
					--a:
					;
				}
			`,
			fixed: `
				a {
					--a: ;
				}
			`,
			line: 2,
			column: 6,
			message: messages.expectedAfter(),
		},
		{
			description: `a value abutting the colon`,
			code: `a { color :pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the colon`,
			code: `a { color :  pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the colon`,
			code: `a { color :\tpink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a break behind the colon`,
			code: `a { color :\npink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color :\r\npink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a value abutting a colon that abuts the property too`,
			code: `a { color:pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `comments on both sides of the colon, neither spaced`,
			code: `a { color/*comment*/:/*comment*/pink; }`,
			fixed: `a { color/*comment*/: /*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `a comment holding an address, whose double slash opens none of its own`,
			code: `a { color/* https://foo.bar/ */:pink; }`,
			fixed: `a { color/* https://foo.bar/ */: pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment holding a colon, which opens no declaration`,
			code: `a { color/* a:b */:pink; }`,
			fixed: `a { color/* a:b */: pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment abutting the colon of a custom property`,
			code: `a { --a:/*comment*/; }`,
			fixed: `a { --a: /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a:/*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment behind two spaces`,
			code: `a { --a:  /*comment*/; }`,
			fixed: `a { --a: /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment behind a tab, with a flag behind it`,
			code: `a { --a:\t/*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment abutting a colon that stands behind a space`,
			code: `a { --a :/*comment*/ !important; }`,
			fixed: `a { --a : /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a custom property with no value at all`,
			code: `a { --a:; color:red; }`,
		},
		{
			description: `a value abutting the colon`,
			code: `a { color:pink }`,
		},
		{
			description: `a space in front of the colon and none behind it`,
			code: `a { color :pink }`,
		},
		{
			description: `a break in front of the colon and nothing behind it`,
			code: `a { color\n:pink }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color\r\n:pink }`,
		},
		{
			description: `an SCSS map, whose inner colon opens no declaration`,
			code: `$map: (key: value)`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `comment with an URL, no space after the declaration's own colon`,
			code: `a { color/* https://foo.bar/ */:pink; }`,
		},
		{
			description: `a comment abutting the colon of a custom property`,
			code: `a { --a:/*comment*/; }`,
		},
		{
			description: `the same comment with no semicolon behind it`,
			code: `a { --a:/*comment*/ }`,
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a:/*comment*/ !important; }`,
		},
		{
			description: `a value and a comment, the value abutting the colon`,
			code: `a { --a:red /*comment*/; }`,
		},
		{
			description: `the same comment abutting a colon that stands behind a space`,
			code: `a { --a :/*comment*/ !important; }`,
		},
	],

	reject: [
		{
			description: `a custom property whose value is a single space`,
			code: `a { --a: ; color:red; }`,
			fixed: `a { --a:; color:red; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space behind the colon`,
			code: `a { color : pink; }`,
			fixed: `a { color :pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces behind the colon`,
			code: `a { color:  pink; }`,
			fixed: `a { color:pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab behind the colon`,
			code: `a { color :\tpink; }`,
			fixed: `a { color :pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the colon`,
			code: `a { color :\npink; }`,
			fixed: `a { color :pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color :\r\npink; }`,
			fixed: `a { color :pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `comments on both sides of the colon, each spaced`,
			code: `a { color/*comment*/ : /*comment*/pink; }`,
			fixed: `a { color/*comment*/ :/*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `a comment holding an address, with a space behind the colon`,
			code: `a { color/* https://foo.bar/ */: pink; }`,
			fixed: `a { color/* https://foo.bar/ */:pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comment holding a colon, with a space behind the real one`,
			code: `a { color/* a:b */: pink; }`,
			fixed: `a { color/* a:b */:pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comment behind a space, in a custom property`,
			code: `a { --a: /*comment*/; }`,
			fixed: `a { --a:/*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment with no semicolon behind it`,
			code: `a { --a: /*comment*/ }`,
			fixed: `a { --a:/*comment*/ }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a: /*comment*/ !important; }`,
			fixed: `a { --a:/*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `a value and a comment behind the colon`,
			code: `a { --a: red /*comment*/; }`,
			fixed: `a { --a:red /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `a value, a comment and a flag behind the colon`,
			code: `a { --a: 10px/*comment*/ !important; }`,
			fixed: `a { --a:10px/*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment behind a colon that stands behind a space`,
			code: `a { --a : /*comment*/; }`,
			fixed: `a { --a :/*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a custom property whose value is a single space, with a declaration behind it`,
			code: `a { --a: ; color: red; }`,
		},
		{
			description: `the same custom property alone in its block`,
			code: `a { --a: ; }`,
		},
		{
			description: `a space behind the colon of a single-line declaration`,
			code: `a { color: pink }`,
		},
		{
			description: `a value broken across lines, with the space behind the colon`,
			code: `a { transition: color 1s,\n\twidth 2s; }`,
		},
		{
			description: `the same value abutting the colon, which this option passes over`,
			code: `a { transition:color 1s,\n\twidth 2s; }`,
		},
		{
			description: `the same value spelled with a carriage return`,
			code: `a { transition:color 1s,\r\n\twidth 2s; }`,
		},
		{
			description: `the same value behind a tab`,
			code: `a { transition:\tcolor 1s,\n\twidth 2s; }`,
		},
		{
			description: `a comment behind a space, in a custom property`,
			code: `a { --a: /*comment*/; }`,
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a: /*comment*/ !important; }`,
		},
		{
			description: `a value and a comment behind the colon`,
			code: `a { --a: red /*comment*/; }`,
		},
		{
			description: `the same comment and flag, with a space in front of the colon`,
			code: `a { --a : /*comment*/ !important; }`,
		},
		{
			description: `the same comment behind a colon that stands behind a tab`,
			code: `a { --a\t: /*comment*/; }`,
		},
	],

	reject: [
		{
			description: `a custom property with no value at all`,
			code: `a { --a:; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a custom property whose value is two spaces`,
			code: `a { --a:  ; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same custom property with a declaration behind it`,
			code: `a { --a:  ; color: red; }`,
			fixed: `a { --a: ; color: red; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a value abutting the colon of a single-line declaration`,
			code: `a { color :pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two spaces behind the colon`,
			code: `a { color :  pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a tab behind the colon`,
			code: `a { color :\tpink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a break behind the colon, which does not make the declaration multi-line`,
			code: `a { color :\npink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color :\r\npink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a value abutting a colon that abuts the property too`,
			code: `a { color:pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `comments on both sides of the colon, neither spaced`,
			code: `a { color/*comment*/:/*comment*/pink; }`,
			fixed: `a { color/*comment*/: /*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a comment abutting the colon of a custom property`,
			code: `a { --a:/*comment*/; }`,
			fixed: `a { --a: /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment with no semicolon behind it`,
			code: `a { --a:/*comment*/ }`,
			fixed: `a { --a: /*comment*/ }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a:/*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment behind two spaces`,
			code: `a { --a:  /*comment*/; }`,
			fixed: `a { --a: /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment behind a tab, with a flag behind it`,
			code: `a { --a:\t/*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment abutting a colon that stands behind a space`,
			code: `a { --a :/*comment*/ !important; }`,
			fixed: `a { --a : /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
	],
})
