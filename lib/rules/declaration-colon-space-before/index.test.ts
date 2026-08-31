import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space in front of the colon and none behind it`,
			code: `a { color :pink }`,
		},
		{
			description: `spaces on both sides of the colon`,
			code: `a { color : pink }`,
		},
		{
			description: `a space in front of the colon and a break behind it`,
			code: `a { color :\npink }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color :\r\npink }`,
		},
		{
			description: `a data URI, whose own colon opens no declaration either`,
			code: `a { background : url(data:application/font-woff;...); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `comment with an URL, space before the declaration's own colon`,
			code: `a { color/* https://foo.bar/ */ :pink; }`,
		},
		{
			description: `a custom property with a space in front of its colon, holding a comment and a flag`,
			code: `a { --a : /*comment*/ !important; }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/408
			description: `a property ending in a run of two solidi, which the search that finds the colon reads to the end of the line as a comment though no syntax spells one there`,
			code: `a { --b//c:\nx:y; }`,
			fixed: `a { --b//c :\nx:y; }`,
			line: 1,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/421
			description: `a property spelling a colon of its own, escaped, which opens no declaration`,
			code: `a { b\\:c: pink; }`,
			fixed: `a { b\\:c : pink; }`,
			line: 1,
			column: 10,
			message: messages.expectedBefore(),
		},
		{
			description: `the same custom property with the colon abutting its name`,
			code: `a { --a: /*comment*/ !important; }`,
			fixed: `a { --a : /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `a colon abutting the property`,
			code: `a { color: pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the colon`,
			code: `a { color  : pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the colon`,
			code: `a { color\t: pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			description: `a break in front of the colon`,
			code: `a { color\n: pink; }`,
			fixed: `a { color : pink; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color\r\n: pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			description: `comments on both sides of the colon, neither spaced`,
			code: `a { color/*comment*/:/*comment*/pink; }`,
			fixed: `a { color/*comment*/ :/*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			description: `a comment holding a double slash, which opens none of its own`,
			code: `a { color/* keep // me */:/*comment*/pink; }`,
			fixed: `a { color/* keep // me */ :/*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `a comment holding an address, likewise`,
			code: `a { color/* https://foo.bar/ */:pink; }`,
			fixed: `a { color/* https://foo.bar/ */ :pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment holding a colon, which opens no declaration`,
			code: `a { color/* a:b */:pink; }`,
			fixed: `a { color/* a:b */ :pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a colon abutting the property, with the value abutting it too`,
			code: `a { color:pink }`,
		},
		{
			description: `a colon abutting the property and a space behind it`,
			code: `a { color: pink }`,
		},
		{
			description: `a break behind the colon, with nothing in front of it`,
			code: `a { color:\npink }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color:\r\npink }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `comment with an URL, no space before the declaration's own colon`,
			code: `a { color/* https://foo.bar/ */:pink; }`,
		},
		{
			description: `a custom property whose colon abuts its name`,
			code: `a { --a: /*comment*/ !important; }`,
		},
	],

	reject: [
		{
			description: `the same custom property with a space in front of the colon`,
			code: `a { --a : /*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the colon`,
			code: `a { color : pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the colon`,
			code: `a { color  : pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the colon`,
			code: `a { color\t: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			description: `a break in front of the colon`,
			code: `a { color\n: pink; }`,
			fixed: `a { color: pink; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color\r\n: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comment in front of a space, with the colon behind the space`,
			code: `a { color/*comment*/ :/*comment*/pink; }`,
			fixed: `a { color/*comment*/:/*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			description: `the same comment holding a double slash`,
			code: `a { color/* keep // me */ :/*comment*/pink; }`,
			fixed: `a { color/* keep // me */:/*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `the same comment holding an address`,
			code: `a { color/* https://foo.bar/ */ :pink; }`,
			fixed: `a { color/* https://foo.bar/ */:pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same comment holding a colon`,
			code: `a { color/* a:b */ :pink; }`,
			fixed: `a { color/* a:b */:pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
	],
})
