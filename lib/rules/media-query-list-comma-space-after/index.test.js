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
			description: `a space after the comma`,
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			description: `a space on either side of the comma`,
			code: `@media screen and (color) , projection and (color) {}`,
		},
		{
			description: `a newline in front of the comma and a space after it`,
			code: `@media screen and (color)\n, projection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color)\r\n, projection and (color) {}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color),projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color),projection and (color) {}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)), print { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `a comma inside the arguments of a function is a comma of the address and of no query list`,
			code: `@media (min-width: url(x/a,b.png)) { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `an escaped parenthesis inside an address closes the arguments of nothing`,
			code: `@media (min-width: url(a\\)b,c)) { a { b: c; } }`,
		},
	],

	reject: [
		{
			description: `no space after the comma`,
			code: `@media screen and (color),projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after the comma, under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color),projection and (color) {}`,
			fixed: `@mEdIa screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after the comma, under an upper-case at-rule name`,
			code: `@MEDIA screen and (color),projection and (color) {}`,
			fixed: `@MEDIA screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `@media screen and (color),  projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a newline after the comma`,
			code: `@media screen and (color),\nprojection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a carriage-return line break after the comma`,
			code: `@media screen and (color),\r\nprojection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `@media screen and (color),\tprojection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment standing right after the comma`,
			code: `@media screen and (color),/*comment*/projection and (color) {}`,
			fixed: `@media screen and (color), /*comment*/projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a run of commas, the last two standing with no query between them`,
			code: `@media tv,tv,tv,, print {}`,
			fixed: `@media tv, tv, tv, , print {}`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 16,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)),print { a { b: c; } }`,
			fixed: `@media (min-width: url(http://x/y.png)), print { a { b: c; } }`,
			line: 1,
			column: 40,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a comma with a space after it inside the address of an import, which opens no query list`,
			code: `@import url(x.com?a=b, c=d)`,
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
			description: `no space after the comma`,
			code: `@media screen and (color),projection and (color) {}`,
		},
		{
			description: `a space in front of the comma and none after it`,
			code: `@media screen and (color) ,projection and (color) {}`,
		},
		{
			description: `a newline in front of the comma and nothing after it`,
			code: `@media screen and (color)\n,projection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color)\r\n,projection and (color) {}`,
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
			description: `a space after the comma`,
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after the comma, under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after the comma, under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `@media screen and (color),  projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfter(),
		},
		{
			description: `a newline after the comma`,
			code: `@media screen and (color),\nprojection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfter(),
		},
		{
			description: `a carriage-return line break after the comma`,
			code: `@media screen and (color),\r\nprojection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `@media screen and (color),\tprojection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfter(),
		},
		{
			description: `spaces around a comment standing after the comma`,
			code: `@media screen and (color), /*comment*/ projection and (color) {}`,
			fixed: `@media screen and (color),/*comment*/ projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a space after the comma of a single-line list`,
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
			description: `no space after the comma of a single-line list`,
			code: `@media screen and (color) ,projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `@media screen and (color) ,projection and (color) {\n}`,
			fixed: `@media screen and (color) , projection and (color) {\n}`,
			line: 1,
			column: 27,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
			fixed: `@media screen and (color) , projection and (color) {\r\n}`,
			line: 1,
			column: 27,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `no space after the comma of a single-line list`,
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
			description: `a space after the comma of a single-line list`,
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `@media screen and (color), projection and (color) {\n}`,
			fixed: `@media screen and (color),projection and (color) {\n}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color), projection and (color) {\r\n}`,
			fixed: `@media screen and (color),projection and (color) {\r\n}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfterSingleLine(),
		},
	],
})
