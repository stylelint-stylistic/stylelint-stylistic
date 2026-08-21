import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@import url(x.com?a=b,c=d)`,
			description: `a comma inside the address of an import, which opens no query list`,
		},
		{
			code: `@media (max-width: 600px) {}`,
			description: `a single query, with no comma to measure`,
		},
		{
			code: `@mEdIa (max-width: 600px) {}`,
			description: `the same query under a mixed-case at-rule name`,
		},
		{
			code: `@MEDIA (max-width: 600px) {}`,
			description: `the same query under an upper-case at-rule name`,
		},
		{
			code: `@media screen and (color) , projection and (color) {}`,
			description: `a space on either side of the comma`,
		},
		{
			code: `@media screen and (color) ,  projection and (color) {}`,
			description: `a space in front of the comma and two after it`,
		},
		{
			code: `@media screen and (color) ,\nprojection and (color) {}`,
			description: `a space in front of the comma and a newline after it`,
		},
		{
			code: `@media screen and (color) ,\r\nprojection and (color) {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `@non-media screen and (color), projection and (color) {}`,
			description: `an at-rule whose name ends in media`,
		},
		{
			code: `@media-non screen and (color), projection and (color) {}`,
			description: `an at-rule whose name opens with media`,
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
			description: `no space in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			description: `no space in front of the comma, under a mixed-case at-rule name`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			description: `no space in front of the comma, under an upper-case at-rule name`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color)  , projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			description: `two spaces in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `@media screen and (color)\n, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			description: `a newline in front of the comma`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media screen and (color)\r\n, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			description: `a carriage-return line break in front of the comma`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media screen and (color)\t, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			description: `a tab in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color)/*comment*/, projection and (color) {}`,
			fixed: `@media screen and (color)/*comment*/ , projection and (color) {}`,
			description: `a comment standing right in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 37,
		},
		{
			code: `@media tv,tv,tv,print {}`,
			fixed: `@media tv ,tv ,tv ,print {}`,
			description: `three commas in a list of media types, none of them with a space in front`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			autoStripIndent: true,
			description: `a double slash standing in the code of a plain CSS text, which spells no comment`,
			code: `@media (a//b),(c) { d { e: f; } }`,
			fixed: `@media (a//b) ,(c) { d { e: f; } }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 14,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `@import url(x.com?a=b ,c=d)`,
			description: `a comma with a space in front of it inside the address of an import, which opens no query list`,
		},
		{
			code: `@media (max-width: 600px) {}`,
			description: `a single query, with no comma to measure`,
		},
		{
			code: `@mEdIa (max-width: 600px) {}`,
			description: `the same query under a mixed-case at-rule name`,
		},
		{
			code: `@MEDIA (max-width: 600px) {}`,
			description: `the same query under an upper-case at-rule name`,
		},
		{
			code: `@media screen and (color),projection and (color) {}`,
			description: `no space in front of the comma`,
		},
		{
			code: `@media screen and (color), projection and (color) {}`,
			description: `no space in front of the comma and one after it`,
		},
		{
			code: `@media screen and (color),\nprojection and (color) {}`,
			description: `no space in front of the comma and a newline after it`,
		},
		{
			code: `@media screen and (color),\r\nprojection and (color) {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `@non-media screen and (color) , projection and (color) {}`,
			description: `an at-rule whose name ends in media`,
		},
		{
			code: `@media-non screen and (color) , projection and (color) {}`,
			description: `an at-rule whose name opens with media`,
		},
	],

	reject: [
		{
			code: `@media screen and (color) , projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a space in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@mEdIa screen and (color) , projection and (color) {}`,
			fixed: `@mEdIa screen and (color), projection and (color) {}`,
			description: `a space in front of the comma, under a mixed-case at-rule name`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@MEDIA screen and (color) , projection and (color) {}`,
			fixed: `@MEDIA screen and (color), projection and (color) {}`,
			description: `a space in front of the comma, under an upper-case at-rule name`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color)  , projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `two spaces in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `@media screen and (color)\n, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a newline in front of the comma`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media screen and (color)\r\n, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a carriage-return line break in front of the comma`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `@media screen and (color)\t, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a tab in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color) /*comment*/ , projection and (color) {}`,
			fixed: `@media screen and (color) /*comment*/, projection and (color) {}`,
			description: `spaces around a comment standing in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 39,
		},
		{
			code: `@media tv ,tv ,tv ,print {}`,
			fixed: `@media tv,tv,tv,print {}`,
			description: `three commas in a list of media types, each with a space in front`,
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
			description: `a space in front of the comma of a single-line list`,
		},
		{
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
			description: `the same list under a mixed-case at-rule name`,
		},
		{
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
			description: `the same list under an upper-case at-rule name`,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\n}`,
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
		{
			code: `@media screen and (color),\nprojection and (color) {}`,
			description: `a multi-line list, which this option does not measure`,
		},
		{
			code: `@media screen and (color),\r\nprojection and (color) {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `@non-media screen and (color), projection and (color) {}`,
			description: `an at-rule whose name ends in media`,
		},
		{
			code: `@media-non screen and (color), projection and (color) {}`,
			description: `an at-rule whose name opens with media`,
		},
	],

	reject: [
		{
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			description: `no space in front of the comma of a single-line list`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			description: `the same list under a mixed-case at-rule name`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			description: `the same list under an upper-case at-rule name`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color), projection and (color) {\n}`,
			fixed: `@media screen and (color) , projection and (color) {\n}`,
			description: `the same list in a multi-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color), projection and (color) {\r\n}`,
			fixed: `@media screen and (color) , projection and (color) {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
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
			description: `no space in front of the comma of a single-line list`,
		},
		{
			code: `@mEdIa screen and (color), projection and (color) {}`,
			description: `the same list under a mixed-case at-rule name`,
		},
		{
			code: `@MEDIA screen and (color), projection and (color) {}`,
			description: `the same list under an upper-case at-rule name`,
		},
		{
			code: `@media screen and (color), projection and (color) {\n}`,
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `@media screen and (color), projection and (color) {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
		{
			code: `@media screen and (color)\n,projection and (color) {}`,
			description: `a multi-line list, which this option does not measure`,
		},
		{
			code: `@media screen and (color)\r\n,projection and (color) {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `@non-media screen and (color) ,projection and (color) {}`,
			description: `an at-rule whose name ends in media`,
		},
		{
			code: `@media-non screen and (color) ,projection and (color) {}`,
			description: `an at-rule whose name opens with media`,
		},
	],

	reject: [
		{
			code: `@media screen and (color) ,projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			description: `a space in front of the comma of a single-line list`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
			fixed: `@mEdIa screen and (color),projection and (color) {}`,
			description: `the same list under a mixed-case at-rule name`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
			fixed: `@MEDIA screen and (color),projection and (color) {}`,
			description: `the same list under an upper-case at-rule name`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\n}`,
			fixed: `@media screen and (color),projection and (color) {\n}`,
			description: `the same list in a multi-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
			fixed: `@media screen and (color),projection and (color) {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
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
