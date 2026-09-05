import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space behind the colon`,
			code: `@media (max-width: 600px) {}`,
		},
		{
			description: `the same query under a name in alternating case`,
			code: `@mEdIa (max-width: 600px) {}`,
		},
		{
			description: `the same query under a name in upper case`,
			code: `@MEDIA (max-width: 600px) {}`,
		},
		{
			description: `a space on each side of the colon`,
			code: `@media (max-width : 600px) {}`,
		},
		{
			description: `two features, each with the space`,
			code: `@media (max-width: 600px) and (min-width: 3em) {}`,
		},
		{
			description: `a custom selector, whose colon opens no media feature`,
			code: `@custom-selector :--enter :hover;`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `a colon inside the arguments of a function belongs to the address and to no media feature`,
			code: `@media (min-width: url(a :b)) { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x)) and (max-width: 1px) { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/252
			description: `the arguments of a call whose name closes on a hyphen, which are a call's rather than a feature's however the colon inside them is spaced`,
			code: `@media a-(max-width:600px) {}`,
		},
	],

	reject: [
		{
			description: `a value abutting the colon`,
			code: `@media (max-width:600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `the same feature behind a hyphen, which names no call and so leaves the parentheses a feature's rather than a call's arguments`,
			code: `@media -(max-width:600px) {}`,
			fixed: `@media -(max-width: 600px) {}`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/252
			description: `the same feature behind a run opening on a digit and carrying a character outside ASCII, which is a dimension in front of a parenthesis and names no call either`,
			code: `@media 2日e(max-width:600px) {}`,
			fixed: `@media 2日e(max-width: 600px) {}`,
			line: 1,
			column: 21,
			message: messages.expectedAfter(),
		},
		{
			description: `the same run with the character spelled as an escape`,
			code: `@media 2\\65 f(max-width:600px) {}`,
			fixed: `@media 2\\65 f(max-width: 600px) {}`,
			line: 1,
			column: 24,
			message: messages.expectedAfter(),
		},
		{
			description: `the same query under a name in alternating case`,
			code: `@mEdIa (max-width:600px) {}`,
			fixed: `@mEdIa (max-width: 600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `the same query under a name in upper case`,
			code: `@MEDIA (max-width:600px) {}`,
			fixed: `@MEDIA (max-width: 600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the colon`,
			code: `@media (max-width:  600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the colon`,
			code: `@media (max-width:\t600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a break behind the colon`,
			code: `@media (max-width:\n600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media (max-width:\r\n600px) {}`,
			fixed: `@media (max-width: 600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `the first of two features abutting its colon`,
			code: `@media (max-width:600px) and (min-width: 3em) {}`,
			fixed: `@media (max-width: 600px) and (min-width: 3em) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `the second of two features abutting its colon`,
			code: `@media (max-width: 600px) and (min-width:3em) {}`,
			fixed: `@media (max-width: 600px) and (min-width: 3em) {}`,
			line: 1,
			column: 41,
			message: messages.expectedAfter(),
		},
		{
			description: `both features abutting their colons`,
			code: `@media (max-width:600px) and (min-width:3em) {}`,
			fixed: `@media (max-width: 600px) and (min-width: 3em) {}`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 40,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `features whose names are single letters, in a query abutting the at-rule name`,
			code: `@media(p:600px) and (prop:600px) {}`,
			fixed: `@media(p: 600px) and (prop: 600px) {}`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 26,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a comment behind the colon, standing where the space belongs`,
			code: `@media (max-width:/*comment*/600px) {}`,
			fixed: `@media (max-width: /*comment*/600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `a feature written without the space its grammar asks for is a feature all the same, and the word joining it names no function`,
			code: `@media screen and(min-width:1px) { a { b: c; } }`,
			fixed: `@media screen and(min-width: 1px) { a { b: c; } }`,
			line: 1,
			column: 28,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/566
			description: `the same feature behind a backslash and a form feed, which the grammar reads a newline in, so that the backslash names nothing and the word is the one joining a feature`,
			code: `@media \\\fand(min-width:1px) { a { b: c; } }`,
			fixed: `@media \\\fand(min-width: 1px) { a { b: c; } }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x)) and (max-width:1px) { a { b: c; } }`,
			fixed: `@media (min-width: url(http://x)) and (max-width: 1px) { a { b: c; } }`,
			line: 1,
			column: 49,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash, so the feature behind it is read`,
			code: `@media (min-width:myurl(//a)) and (max-width:2px) { a { b: c; } }`,
			fixed: `@media (min-width: myurl(//a)) and (max-width: 2px) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 45,
					message: messages.expectedAfter(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a value abutting the colon`,
			code: `@media (max-width:600px) {}`,
		},
		{
			description: `the same query under a name in alternating case`,
			code: `@mEdIa (max-width:600px) {}`,
		},
		{
			description: `the same query under a name in upper case`,
			code: `@MEDIA (max-width:600px) {}`,
		},
		{
			description: `two features, neither with a space`,
			code: `@media (max-width:600px) and (min-width:3em) {}`,
		},
		{
			description: `a custom selector, whose colon opens no media feature`,
			code: `@custom-selector : --enter :hover;`,
		},
	],

	reject: [
		{
			description: `a space behind the colon`,
			code: `@media (max-width: 600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same query under a name in alternating case`,
			code: `@mEdIa (max-width: 600px) {}`,
			fixed: `@mEdIa (max-width:600px) {}`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same query under a name in upper case`,
			code: `@MEDIA (max-width: 600px) {}`,
			fixed: `@MEDIA (max-width:600px) {}`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces behind the colon`,
			code: `@media (max-width:  600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab behind the colon`,
			code: `@media (max-width:\t600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the colon`,
			code: `@media (max-width:\n600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media (max-width:\r\n600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `the second of two features carrying the space`,
			code: `@media (max-width:600px) and (min-width: 3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			line: 1,
			column: 40,
			message: messages.rejectedAfter(),
		},
		{
			description: `the first of two features carrying the space`,
			code: `@media (max-width: 600px) and (min-width:3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `both features carrying the space`,
			code: `@media (max-width: 600px) and (min-width: 3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 41,
					message: messages.rejectedAfter(),
				},
			],
		},
		{
			description: `a comment behind the colon, spaced on both sides`,
			code: `@media (max-width: /*comment*/ 600px) {}`,
			fixed: `@media (max-width:/*comment*/ 600px) {}`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
	],
})

// A vertical tab and a no-break space are words to PostCSS's tokenizer (#496): the fix rewrites only the run the tokenizer reads beside its anchor, and such a character stays where the fix used to carry it off with the run.
testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
			description: `a vertical tab behind the colon, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `@media (a:\v10px) {}`,
			fixed: `@media (a: \v10px) {}`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
			description: `a vertical tab behind the run after the colon: only the tokenizer's run goes, and the character stays`,
			code: `@media (a: \v10px) {}`,
			fixed: `@media (a:\v10px) {}`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.rejectedAfter(),
		},
	],
})
