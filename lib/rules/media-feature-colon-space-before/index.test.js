import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@media (max-width :600px) {}`,
			description: `a space in front of the colon`,
		},
		{
			code: `@mEdIa (max-width :600px) {}`,
			description: `the same query under a name in alternating case`,
		},
		{
			code: `@MEDIA (max-width :600px) {}`,
			description: `the same query under a name in upper case`,
		},
		{
			code: `@media (max-width : 600px) {}`,
			description: `a space on each side of the colon`,
		},
		{
			code: `@media (max-width :600px) and (min-width :3em) {}`,
			description: `two features, each with the space`,
		},
		{
			code: `@custom-selector:--enter :hover;`,
			description: `a custom selector, whose colon opens no media feature`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `a colon inside the arguments of a function belongs to the address and to no media feature`,
			code: `@media (min-width : url(a:b)) { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width : url(http://x)) and (max-width :1px) { a { b: c; } }`,
		},
	],

	reject: [
		{
			code: `@media (max-width:600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			description: `a colon abutting the feature name`,
			message: messages.expectedBefore(),
			line: 1,
			column: 18,
		},
		{
			code: `@mEdIa (max-width:600px) {}`,
			fixed: `@mEdIa (max-width :600px) {}`,
			description: `the same query under a name in alternating case`,
			message: messages.expectedBefore(),
			line: 1,
			column: 18,
		},
		{
			code: `@MEDIA (max-width:600px) {}`,
			fixed: `@MEDIA (max-width :600px) {}`,
			description: `the same query under a name in upper case`,
			message: messages.expectedBefore(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width  :600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			description: `two spaces in front of the colon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 20,
		},
		{
			code: `@media (max-width\t:600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			description: `a tab in front of the colon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 19,
		},
		{
			code: `@media (max-width\n:600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			description: `a break in front of the colon`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media (max-width\r\n:600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media (max-width:600px) and (min-width :3em) {}`,
			fixed: `@media (max-width :600px) and (min-width :3em) {}`,
			description: `the first of two features abutting its colon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 18,
		},
		{
			code: `@media (max-width :600px) and (min-width:3em) {}`,
			fixed: `@media (max-width :600px) and (min-width :3em) {}`,
			description: `the second of two features abutting its colon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 41,
		},
		{
			code: `@media (max-width:600px) and (min-width:3em) {}`,
			fixed: `@media (max-width :600px) and (min-width :3em) {}`,
			description: `both features abutting their colons`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 18,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 40,
				},
			],
		},
		{
			code: `@media (max-width/*comment*/:600px) {}`,
			fixed: `@media (max-width/*comment*/ :600px) {}`,
			description: `a comment in front of the colon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 29,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width : url(http://x)) and (max-width:1px) { a { b: c; } }`,
			fixed: `@media (min-width : url(http://x)) and (max-width :1px) { a { b: c; } }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 50,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `@media (max-width:600px) {}`,
			description: `a colon abutting the feature name`,
		},
		{
			code: `@mEdIa (max-width:600px) {}`,
			description: `the same query under a name in alternating case`,
		},
		{
			code: `@MEDIA (max-width:600px) {}`,
			description: `the same query under a name in upper case`,
		},
		{
			code: `@media (max-width: 600px) {}`,
			description: `a space behind the colon, which this rule says nothing about`,
		},
		{
			code: `@media (max-width:600px) and (min-width:3em) {}`,
			description: `two features, neither with a space in front of its colon`,
		},
		{
			code: `@custom-selector :--enter :hover;`,
			description: `a custom selector, whose colon opens no media feature`,
		},
	],

	reject: [
		{
			code: `@media (max-width :600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			description: `a space in front of the colon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 19,
		},
		{
			code: `@mEdIa (max-width :600px) {}`,
			fixed: `@mEdIa (max-width:600px) {}`,
			description: `the same query under a name in alternating case`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 19,
		},
		{
			code: `@MEDIA (max-width :600px) {}`,
			fixed: `@MEDIA (max-width:600px) {}`,
			description: `the same query under a name in upper case`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 19,
		},
		{
			code: `@media (max-width  :600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			description: `two spaces in front of the colon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 20,
		},
		{
			code: `@media (max-width\t:600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			description: `a tab in front of the colon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 19,
		},
		{
			code: `@media (max-width\n:600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			description: `a break in front of the colon`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media (max-width\r\n:600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media (max-width:600px) and (min-width :3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			description: `the second of two features carrying the space`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 41,
		},
		{
			code: `@media (max-width :600px) and (min-width:3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			description: `the first of two features carrying the space`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 19,
		},
		{
			code: `@media (max-width :600px) and (min-width :3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			description: `both features carrying the space`,
			warnings: [
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 19,
				},
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 42,
				},
			],
		},
		{
			code: `@media (max-width /*comment*/ :600px) {}`,
			fixed: `@media (max-width /*comment*/:600px) {}`,
			description: `a comment in front of the colon, spaced on both sides`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 31,
		},
	],
})
