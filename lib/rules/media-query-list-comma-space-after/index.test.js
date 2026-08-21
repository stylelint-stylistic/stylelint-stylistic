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
			code: `@media screen and (color), projection and (color) {}`,
			description: `a space after the comma`,
		},
		{
			code: `@media screen and (color) , projection and (color) {}`,
			description: `a space on either side of the comma`,
		},
		{
			code: `@media screen and (color)\n, projection and (color) {}`,
			description: `a newline in front of the comma and a space after it`,
		},
		{
			code: `@media screen and (color)\r\n, projection and (color) {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `@non-media screen and (color),projection and (color) {}`,
			description: `an at-rule whose name ends in media`,
		},
		{
			code: `@media-non screen and (color),projection and (color) {}`,
			description: `an at-rule whose name opens with media`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			autoStripIndent: true,
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)), print { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			autoStripIndent: true,
			description: `a comma inside the arguments of a function is a comma of the address and of no query list`,
			code: `@media (min-width: url(x/a,b.png)) { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			autoStripIndent: true,
			description: `an escaped parenthesis inside an address closes the arguments of nothing`,
			code: `@media (min-width: url(a\\)b,c)) { a { b: c; } }`,
		},
	],

	reject: [
		{
			code: `@media screen and (color),projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `no space after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@mEdIa screen and (color),projection and (color) {}`,
			fixed: `@mEdIa screen and (color), projection and (color) {}`,
			description: `no space after the comma, under a mixed-case at-rule name`,
			message: messages.expectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@MEDIA screen and (color),projection and (color) {}`,
			fixed: `@MEDIA screen and (color), projection and (color) {}`,
			description: `no space after the comma, under an upper-case at-rule name`,
			message: messages.expectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color),  projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `two spaces after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color),\nprojection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a newline after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color),\r\nprojection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a carriage-return line break after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color),\tprojection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a tab after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color),/*comment*/projection and (color) {}`,
			fixed: `@media screen and (color), /*comment*/projection and (color) {}`,
			description: `a comment standing right after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media tv,tv,tv,, print {}`,
			fixed: `@media tv, tv, tv, , print {}`,
			description: `a run of commas, the last two standing with no query between them`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 10,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 13,
				},
				{
					message: messages.expectedAfter(),
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
			fixed: `@media (min-width: url(http://x/y.png)), print { a { b: c; } }`,
			message: messages.expectedAfter(),
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
			code: `@import url(x.com?a=b, c=d)`,
			description: `a comma with a space after it inside the address of an import, which opens no query list`,
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
			description: `no space after the comma`,
		},
		{
			code: `@media screen and (color) ,projection and (color) {}`,
			description: `a space in front of the comma and none after it`,
		},
		{
			code: `@media screen and (color)\n,projection and (color) {}`,
			description: `a newline in front of the comma and nothing after it`,
		},
		{
			code: `@media screen and (color)\r\n,projection and (color) {}`,
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
			fixed: `@media screen and (color),projection and (color) {}`,
			description: `a space after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color),projection and (color) {}`,
			description: `a space after the comma, under a mixed-case at-rule name`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color),projection and (color) {}`,
			description: `a space after the comma, under an upper-case at-rule name`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color),  projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			description: `two spaces after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color),\nprojection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			description: `a newline after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color),\r\nprojection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			description: `a carriage-return line break after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color),\tprojection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			description: `a tab after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color), /*comment*/ projection and (color) {}`,
			fixed: `@media screen and (color),/*comment*/ projection and (color) {}`,
			description: `spaces around a comment standing after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 26,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `@media screen and (color), projection and (color) {}`,
			description: `a space after the comma of a single-line list`,
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
			fixed: `@media screen and (color) , projection and (color) {}`,
			description: `no space after the comma of a single-line list`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			description: `the same list under a mixed-case at-rule name`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			description: `the same list under an upper-case at-rule name`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\n}`,
			fixed: `@media screen and (color) , projection and (color) {\n}`,
			description: `the same list in a multi-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 27,
		},
		{
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
			fixed: `@media screen and (color) , projection and (color) {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 27,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `@media screen and (color) ,projection and (color) {}`,
			description: `no space after the comma of a single-line list`,
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
			fixed: `@media screen and (color),projection and (color) {}`,
			description: `a space after the comma of a single-line list`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color),projection and (color) {}`,
			description: `the same list under a mixed-case at-rule name`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color),projection and (color) {}`,
			description: `the same list under an upper-case at-rule name`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color), projection and (color) {\n}`,
			fixed: `@media screen and (color),projection and (color) {\n}`,
			description: `the same list in a multi-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `@media screen and (color), projection and (color) {\r\n}`,
			fixed: `@media screen and (color),projection and (color) {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 26,
		},
	],
})
