import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { color :pink }`,
			description: `a space in front of the colon and none behind it`,
		},
		{
			code: `a { color : pink }`,
			description: `spaces on both sides of the colon`,
		},
		{
			code: `a { color :\npink }`,
			description: `a space in front of the colon and a break behind it`,
		},
		{
			code: `a { color :\r\npink }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `$map:(key:value)`,
			description: `an SCSS map written on one line, whose inner colon opens no declaration`,
		},
		{
			code: `$list:('value1', 'value2')`,
			description: `an SCSS list written on one line`,
		},
		{
			code: `a { background : url(data:application/font-woff;...); }`,
			description: `a data URI, whose own colon opens no declaration either`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			code: `a { color/* https://foo.bar/ */ :pink; }`,
			description: `comment with an URL, space before the declaration's own colon`,
		},
		{
			code: `a { --a : /*comment*/ !important; }`,
			description: `a custom property with a space in front of its colon, holding a comment and a flag`,
		},
	],

	reject: [
		{
			code: `a { --a: /*comment*/ !important; }`,
			fixed: `a { --a : /*comment*/ !important; }`,
			description: `the same custom property with the colon abutting its name`,
			message: messages.expectedBefore(),
			line: 1,
			column: 9,
		},
		{
			code: `a { color: pink; }`,
			fixed: `a { color : pink; }`,
			description: `a colon abutting the property`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color  : pink; }`,
			fixed: `a { color : pink; }`,
			description: `two spaces in front of the colon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color\t: pink; }`,
			fixed: `a { color : pink; }`,
			description: `a tab in front of the colon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color\n: pink; }`,
			fixed: `a { color : pink; }`,
			description: `a break in front of the colon`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { color\r\n: pink; }`,
			fixed: `a { color : pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/*comment*/:/*comment*/pink; }`,
			fixed: `a { color/*comment*/ :/*comment*/pink; }`,
			description: `comments on both sides of the colon, neither spaced`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			code: `a { color/* keep // me */:/*comment*/pink; }`,
			fixed: `a { color/* keep // me */ :/*comment*/pink; }`,
			description: `a comment holding a double slash, which opens none of its own`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			code: `a { color/* https://foo.bar/ */:pink; }`,
			fixed: `a { color/* https://foo.bar/ */ :pink; }`,
			description: `a comment holding an address, likewise`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/* a:b */:pink; }`,
			fixed: `a { color/* a:b */ :pink; }`,
			description: `a comment holding a colon, which opens no declaration`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { color:pink }`,
			description: `a colon abutting the property, with the value abutting it too`,
		},
		{
			code: `a { color: pink }`,
			description: `a colon abutting the property and a space behind it`,
		},
		{
			code: `a { color:\npink }`,
			description: `a break behind the colon, with nothing in front of it`,
		},
		{
			code: `a { color:\r\npink }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `$map :(key :value)`,
			description: `an SCSS map, whose inner colon is spaced as the outer one is`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			code: `a { color/* https://foo.bar/ */:pink; }`,
			description: `comment with an URL, no space before the declaration's own colon`,
		},
		{
			code: `a { --a: /*comment*/ !important; }`,
			description: `a custom property whose colon abuts its name`,
		},
	],

	reject: [
		{
			code: `a { --a : /*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			description: `the same custom property with a space in front of the colon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 9,
		},
		{
			code: `a { color : pink; }`,
			fixed: `a { color: pink; }`,
			description: `a space in front of the colon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color  : pink; }`,
			fixed: `a { color: pink; }`,
			description: `two spaces in front of the colon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color\t: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a tab in front of the colon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color\n: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a break in front of the colon`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { color\r\n: pink; }`,
			fixed: `a { color: pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/*comment*/ :/*comment*/pink; }`,
			fixed: `a { color/*comment*/:/*comment*/pink; }`,
			description: `a comment in front of a space, with the colon behind the space`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			code: `a { color/* keep // me */ :/*comment*/pink; }`,
			fixed: `a { color/* keep // me */:/*comment*/pink; }`,
			description: `the same comment holding a double slash`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			code: `a { color/* https://foo.bar/ */ :pink; }`,
			fixed: `a { color/* https://foo.bar/ */:pink; }`,
			description: `the same comment holding an address`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/* a:b */ :pink; }`,
			fixed: `a { color/* a:b */:pink; }`,
			description: `the same comment holding a colon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			description: `inline comment before the colon: the colon cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				a {
					color // keep me
					: pink;
				}
			`,
			fixed: `
				a {
					color // keep me
					: pink;
				}
			`,
			message: messages.expectedBefore(),
			line: 2,
			column: 8,
		},
		{
			code: `a { color // keep me\r\n: pink; }`,
			fixed: `a { color // keep me\r\n: pink; }`,
			description: `CRLF, inline comment: the line ending survives untouched`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			description: `inline comment before the colon: the colon cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				a {
					color // keep me
					: pink;
				}
			`,
			fixed: `
				a {
					color // keep me
					: pink;
				}
			`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 8,
		},
		{
			code: `a { color // keep me\r\n: pink; }`,
			fixed: `a { color // keep me\r\n: pink; }`,
			description: `CRLF, inline comment: the line ending survives untouched`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
	],
})
