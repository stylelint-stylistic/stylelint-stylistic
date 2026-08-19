import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@import url(x.com?a=b,c=d)`,
		},
		{
			code: `@media (max-width: 600px) {}`,
		},
		{
			code: `@mEdIa (max-width: 600px) {}`,
		},
		{
			code: `@MEDIA (max-width: 600px) {}`,
		},
		{
			code: `@media screen and (color) , projection and (color) {}`,
		},
		{
			code: `@media screen and (color) ,  projection and (color) {}`,
		},
		{
			code: `@media screen and (color) ,\nprojection and (color) {}`,
		},
		{
			code: `@media screen and (color) ,\r\nprojection and (color) {}`,
			description: `CRLF`,
		},
		{
			code: `@non-media screen and (color), projection and (color) {}`,
			description: `ignore at-rules contain media in name`,
		},
		{
			code: `@media-non screen and (color), projection and (color) {}`,
			description: `ignore at-rules contain media in name`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			autoStripIndent: true,
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)) ,print { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			autoStripIndent: true,
			description: `a comma inside the arguments of a function is a comma of the address and of no query list`,
			code: `@media (min-width: url(x/a,b.png)) { a { b: c; } }`,
		},
	],

	reject: [
		{
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color)  , projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			message: messages.expectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `@media screen and (color)\n, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media screen and (color)\r\n, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			description: `CRLF`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media screen and (color)\t, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color)/*comment*/, projection and (color) {}`,
			fixed: `@media screen and (color)/*comment*/ , projection and (color) {}`,
			message: messages.expectedBefore(),
			line: 1,
			column: 37,
		},
		{
			code: `@media tv,tv,tv,print {}`,
			fixed: `@media tv ,tv ,tv ,print {}`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 10,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 13,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 16,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			autoStripIndent: true,
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)),print { a { b: c; } }`,
			fixed: `@media (min-width: url(http://x/y.png)) ,print { a { b: c; } }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 40,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `@import url(x.com?a=b ,c=d)`,
		},
		{
			code: `@media (max-width: 600px) {}`,
		},
		{
			code: `@mEdIa (max-width: 600px) {}`,
		},
		{
			code: `@MEDIA (max-width: 600px) {}`,
		},
		{
			code: `@media screen and (color),projection and (color) {}`,
		},
		{
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			code: `@media screen and (color),\nprojection and (color) {}`,
		},
		{
			code: `@media screen and (color),\r\nprojection and (color) {}`,
			description: `CRLF`,
		},
		{
			code: `@non-media screen and (color) , projection and (color) {}`,
			description: `ignore at-rules contain media in name`,
		},
		{
			code: `@media-non screen and (color) , projection and (color) {}`,
			description: `ignore at-rules contain media in name`,
		},
	],

	reject: [
		{
			code: `@media screen and (color) , projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@mEdIa screen and (color) , projection and (color) {}`,
			fixed: `@mEdIa screen and (color), projection and (color) {}`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@MEDIA screen and (color) , projection and (color) {}`,
			fixed: `@MEDIA screen and (color), projection and (color) {}`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color)  , projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `@media screen and (color)\n, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media screen and (color)\r\n, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `CRLF`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media screen and (color)\t, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color) /*comment*/ , projection and (color) {}`,
			fixed: `@media screen and (color) /*comment*/, projection and (color) {}`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 39,
		},
		{
			code: `@media tv ,tv ,tv ,print {}`,
			fixed: `@media tv,tv,tv,print {}`,
			warnings: [
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 11,
				},
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 15,
				},
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 19,
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
			code: `@media screen and (color) ,projection and (color) {}`,
		},
		{
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
		},
		{
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\n}`,
			description: `single-line list, multi-line block`,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
			description: `single-line list, multi-line block and CRLF`,
		},
		{
			code: `@media screen and (color),\nprojection and (color) {}`,
			description: `ignore multi-line`,
		},
		{
			code: `@media screen and (color),\r\nprojection and (color) {}`,
			description: `ignore multi-line`,
		},
		{
			code: `@non-media screen and (color), projection and (color) {}`,
			description: `ignore at-rules contain media in name`,
		},
		{
			code: `@media-non screen and (color), projection and (color) {}`,
			description: `ignore at-rules contain media in name`,
		},
	],

	reject: [
		{
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color), projection and (color) {\n}`,
			fixed: `@media screen and (color) , projection and (color) {\n}`,
			description: `single-line list, multi-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color), projection and (color) {\r\n}`,
			fixed: `@media screen and (color) , projection and (color) {\r\n}`,
			description: `single-line list, multi-line block and CRLF`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			code: `@mEdIa screen and (color), projection and (color) {}`,
		},
		{
			code: `@MEDIA screen and (color), projection and (color) {}`,
		},
		{
			code: `@media screen and (color), projection and (color) {\n}`,
			description: `single-line list, multi-line block`,
		},
		{
			code: `@media screen and (color), projection and (color) {\r\n}`,
			description: `single-line list, multi-line block and CRLF`,
		},
		{
			code: `@media screen and (color)\n,projection and (color) {}`,
			description: `ignore multi-line`,
		},
		{
			code: `@media screen and (color)\r\n,projection and (color) {}`,
			description: `ignore multi-line and CRLF`,
		},
		{
			code: `@non-media screen and (color) ,projection and (color) {}`,
			description: `ignore at-rules contain media in name`,
		},
		{
			code: `@media-non screen and (color) ,projection and (color) {}`,
			description: `ignore at-rules contain media in name`,
		},
	],

	reject: [
		{
			code: `@media screen and (color) ,projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
			fixed: `@mEdIa screen and (color),projection and (color) {}`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
			fixed: `@MEDIA screen and (color),projection and (color) {}`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\n}`,
			fixed: `@media screen and (color),projection and (color) {\n}`,
			description: `single-line list, multi-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
			fixed: `@media screen and (color),projection and (color) {\r\n}`,
			description: `single-line list, multi-line block and CRLF`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 27,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

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
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

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
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
	],
})
