import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space in front of the colon`,
			code: `@media (max-width :600px) {}`,
		},
		{
			description: `the same query under a name in alternating case`,
			code: `@mEdIa (max-width :600px) {}`,
		},
		{
			description: `the same query under a name in upper case`,
			code: `@MEDIA (max-width :600px) {}`,
		},
		{
			description: `a space on each side of the colon`,
			code: `@media (max-width : 600px) {}`,
		},
		{
			description: `two features, each with the space`,
			code: `@media (max-width :600px) and (min-width :3em) {}`,
		},
		{
			description: `a custom selector, whose colon opens no media feature`,
			code: `@custom-selector:--enter :hover;`,
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
			description: `a colon abutting the feature name`,
			code: `@media (max-width:600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `the same query under a name in alternating case`,
			code: `@mEdIa (max-width:600px) {}`,
			fixed: `@mEdIa (max-width :600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `the same query under a name in upper case`,
			code: `@MEDIA (max-width:600px) {}`,
			fixed: `@MEDIA (max-width :600px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the colon`,
			code: `@media (max-width  :600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			line: 1,
			column: 20,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the colon`,
			code: `@media (max-width\t:600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			line: 1,
			column: 19,
			message: messages.expectedBefore(),
		},
		{
			description: `a break in front of the colon`,
			code: `@media (max-width\n:600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media (max-width\r\n:600px) {}`,
			fixed: `@media (max-width :600px) {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `the first of two features abutting its colon`,
			code: `@media (max-width:600px) and (min-width :3em) {}`,
			fixed: `@media (max-width :600px) and (min-width :3em) {}`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `the second of two features abutting its colon`,
			code: `@media (max-width :600px) and (min-width:3em) {}`,
			fixed: `@media (max-width :600px) and (min-width :3em) {}`,
			line: 1,
			column: 41,
			message: messages.expectedBefore(),
		},
		{
			description: `both features abutting their colons`,
			code: `@media (max-width:600px) and (min-width:3em) {}`,
			fixed: `@media (max-width :600px) and (min-width :3em) {}`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 40,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `a comment in front of the colon`,
			code: `@media (max-width/*comment*/:600px) {}`,
			fixed: `@media (max-width/*comment*/ :600px) {}`,
			line: 1,
			column: 29,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width : url(http://x)) and (max-width:1px) { a { b: c; } }`,
			fixed: `@media (min-width : url(http://x)) and (max-width :1px) { a { b: c; } }`,
			line: 1,
			column: 50,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a colon abutting the feature name`,
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
			description: `a space behind the colon, which this rule says nothing about`,
			code: `@media (max-width: 600px) {}`,
		},
		{
			description: `two features, neither with a space in front of its colon`,
			code: `@media (max-width:600px) and (min-width:3em) {}`,
		},
		{
			description: `a custom selector, whose colon opens no media feature`,
			code: `@custom-selector :--enter :hover;`,
		},
	],

	reject: [
		{
			description: `a space in front of the colon`,
			code: `@media (max-width :600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 1,
			column: 19,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same query under a name in alternating case`,
			code: `@mEdIa (max-width :600px) {}`,
			fixed: `@mEdIa (max-width:600px) {}`,
			line: 1,
			column: 19,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same query under a name in upper case`,
			code: `@MEDIA (max-width :600px) {}`,
			fixed: `@MEDIA (max-width:600px) {}`,
			line: 1,
			column: 19,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the colon`,
			code: `@media (max-width  :600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 1,
			column: 20,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the colon`,
			code: `@media (max-width\t:600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 1,
			column: 19,
			message: messages.rejectedBefore(),
		},
		{
			description: `a break in front of the colon`,
			code: `@media (max-width\n:600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media (max-width\r\n:600px) {}`,
			fixed: `@media (max-width:600px) {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `the second of two features carrying the space`,
			code: `@media (max-width:600px) and (min-width :3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			line: 1,
			column: 41,
			message: messages.rejectedBefore(),
		},
		{
			description: `the first of two features carrying the space`,
			code: `@media (max-width :600px) and (min-width:3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			line: 1,
			column: 19,
			message: messages.rejectedBefore(),
		},
		{
			description: `both features carrying the space`,
			code: `@media (max-width :600px) and (min-width :3em) {}`,
			fixed: `@media (max-width:600px) and (min-width:3em) {}`,
			warnings: [
				{
					line: 1,
					column: 19,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 42,
					message: messages.rejectedBefore(),
				},
			],
		},
		{
			description: `a comment in front of the colon, spaced on both sides`,
			code: `@media (max-width /*comment*/ :600px) {}`,
			fixed: `@media (max-width /*comment*/:600px) {}`,
			line: 1,
			column: 31,
			message: messages.rejectedBefore(),
		},
	],
})
