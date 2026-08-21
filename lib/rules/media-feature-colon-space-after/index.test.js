import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

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

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `a feature standing behind an interpolated query, which names no function and opens no call`,
			code: `@media #{$q}(min-width:1px) { a { b: c; } }`,
			fixed: `@media #{$q}(min-width: 1px) { a { b: c; } }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/115
			description: `the fix reaches the copy of the parameters this syntax prints, and the inline comment keeps its spelling`,
			code: `
				@media (min-width:1px) and // c
				(max-width:2px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 1px) and // c
				(max-width: 2px) { a { color: red; } }
			`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedAfter(),
				},
				{
					line: 2,
					column: 11,
					message: messages.expectedAfter(),
				},
			],
		},
	],
})
