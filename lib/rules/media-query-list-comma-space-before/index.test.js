import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a comma inside the address of an import, which opens no query list`,
			code: `@import url(x.com?a=b,c=d)`,
		},
		{
			description: `a single query, with no comma to measure`,
			code: `@media (max-width: 600px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 600px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 600px) {}`,
		},
		{
			description: `a space on either side of the comma`,
			code: `@media screen and (color) , projection and (color) {}`,
		},
		{
			description: `a space in front of the comma and two after it`,
			code: `@media screen and (color) ,  projection and (color) {}`,
		},
		{
			description: `a space in front of the comma and a newline after it`,
			code: `@media screen and (color) ,\nprojection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color) ,\r\nprojection and (color) {}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color), projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color), projection and (color) {}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)) ,print { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `a comma inside the arguments of a function is a comma of the address and of no query list`,
			code: `@media (min-width: url(x/a,b.png)) { a { b: c; } }`,
		},
	],

	reject: [
		{
			description: `no space in front of the comma`,
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the comma, under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the comma, under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `@media screen and (color)  , projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 1,
			column: 28,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `@media screen and (color)\n, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `@media screen and (color)\r\n, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `@media screen and (color)\t, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment standing right in front of the comma`,
			code: `@media screen and (color)/*comment*/, projection and (color) {}`,
			fixed: `@media screen and (color)/*comment*/ , projection and (color) {}`,
			line: 1,
			column: 37,
			message: messages.expectedBefore(),
		},
		{
			description: `three commas in a list of media types, none of them with a space in front`,
			code: `@media tv,tv,tv,print {}`,
			fixed: `@media tv ,tv ,tv ,print {}`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 16,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)),print { a { b: c; } }`,
			fixed: `@media (min-width: url(http://x/y.png)) ,print { a { b: c; } }`,
			line: 1,
			column: 40,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a double slash standing in the code of a plain CSS text, which spells no comment`,
			code: `@media (a//b),(c) { d { e: f; } }`,
			fixed: `@media (a//b) ,(c) { d { e: f; } }`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a comma with a space in front of it inside the address of an import, which opens no query list`,
			code: `@import url(x.com?a=b ,c=d)`,
		},
		{
			description: `a single query, with no comma to measure`,
			code: `@media (max-width: 600px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 600px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 600px) {}`,
		},
		{
			description: `no space in front of the comma`,
			code: `@media screen and (color),projection and (color) {}`,
		},
		{
			description: `no space in front of the comma and one after it`,
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			description: `no space in front of the comma and a newline after it`,
			code: `@media screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color),\r\nprojection and (color) {}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color) , projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color) , projection and (color) {}`,
		},
	],

	reject: [
		{
			description: `a space in front of the comma`,
			code: `@media screen and (color) , projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the comma, under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) , projection and (color) {}`,
			fixed: `@mEdIa screen and (color), projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the comma, under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) , projection and (color) {}`,
			fixed: `@MEDIA screen and (color), projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `@media screen and (color)  , projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 28,
			message: messages.rejectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `@media screen and (color)\n, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `@media screen and (color)\r\n, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `@media screen and (color)\t, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `spaces around a comment standing in front of the comma`,
			code: `@media screen and (color) /*comment*/ , projection and (color) {}`,
			fixed: `@media screen and (color) /*comment*/, projection and (color) {}`,
			line: 1,
			column: 39,
			message: messages.rejectedBefore(),
		},
		{
			description: `three commas in a list of media types, each with a space in front`,
			code: `@media tv ,tv ,tv ,print {}`,
			fixed: `@media tv,tv,tv,print {}`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 15,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 19,
					message: messages.rejectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a space in front of the comma of a single-line list`,
			code: `@media screen and (color) ,projection and (color) {}`,
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `@media screen and (color) ,projection and (color) {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
		},
		{
			description: `a multi-line list, which this option does not measure`,
			code: `@media screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color),\r\nprojection and (color) {}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color), projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color), projection and (color) {}`,
		},
	],

	reject: [
		{
			description: `no space in front of the comma of a single-line list`,
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `@media screen and (color), projection and (color) {\n}`,
			fixed: `@media screen and (color) , projection and (color) {\n}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color), projection and (color) {\r\n}`,
			fixed: `@media screen and (color) , projection and (color) {\r\n}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `no space in front of the comma of a single-line list`,
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `@media screen and (color), projection and (color) {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color), projection and (color) {\r\n}`,
		},
		{
			description: `a multi-line list, which this option does not measure`,
			code: `@media screen and (color)\n,projection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color)\r\n,projection and (color) {}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color) ,projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color) ,projection and (color) {}`,
		},
	],

	reject: [
		{
			description: `a space in front of the comma of a single-line list`,
			code: `@media screen and (color) ,projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
			fixed: `@mEdIa screen and (color),projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
			fixed: `@MEDIA screen and (color),projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `@media screen and (color) ,projection and (color) {\n}`,
			fixed: `@media screen and (color),projection and (color) {\n}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
			fixed: `@media screen and (color),projection and (color) {\r\n}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/137
			description: `inline comment before the comma: the comma cannot join the comment's line, so the parameters are left alone and the warning stands`,
			code: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/137
			description: `a comma inside the text of an inline comment is no comma of the query`,
			code: `
				@media (min-width: 1px), // a , b
				(max-width: 2px) { a { color: red; } }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/137
			description: `inline comment before the comma: the comma cannot join the comment's line, so the parameters are left alone and the warning stands`,
			code: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
	],
})
