import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

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
			description: `a newline after the comma`,
			code: `@media screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `two newlines after the comma`,
			code: `
				@media screen and (color),

				projection and (color) {}
			`,
		},
		{
			description: `a space in front of the comma and a newline with indentation after it`,
			code: `@media screen and (color) ,\n  projection and (color) {}`,
		},
		{
			description: `a carriage return and a newline after the comma`,
			code: `@media screen and (color) ,\r\n  projection and (color) {}`,
		},
		{
			description: `two carriage-return line breaks after the comma`,
			code: `@media screen and (color) ,\r\n\r\n  projection and (color) {}`,
		},
		{
			description: `a comma on a line of its own, the next query indented under it`,
			code: `@media screen and (color)\n,\n\t\t\tprojection and (color) {}`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `@media screen and (color)\r\n,\r\n\t\t\tprojection and (color) {}`,
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
			description: `a comment standing right after the comma, the newline behind it`,
			code: `@media screen and (color),/*comment*/\nprojection and (color) {}`,
		},
		{
			description: `a space, a comment, and then the newline`,
			code: `@media screen and (color), /*comment*/\nprojection and (color) {}`,
		},
		{
			description: `two comments standing between the comma and the newline`,
			code: `@media screen and (color), /*comment1*/ /*comment2*/\nprojection and (color) {}`,
		},
		{
			description: `a comment after the comma, closed by a carriage-return line break`,
			code: `@media screen and (color),/*comment*/\r\nprojection and (color) {}`,
		},
		{
			description: `a space, a comment, and a carriage-return line break`,
			code: `@media screen and (color), /*comment*/\r\nprojection and (color) {}`,
		},
		{
			description: `two comments after the comma, the second broken over two lines`,
			code: `@media screen and (color), /*comment1*/ /*com\r\nment2*/\r\nprojection and (color) {}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `
				@media (min-width: url(http://x/y.png)),
				print { a { b: c; } }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `a comma inside the arguments of a function is a comma of the address and of no query list`,
			code: `@media (min-width: url(x/a,b.png)) { a { b: c; } }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			description: `spaces and a form feed behind the comma, which are whitespace and no line break, so a line feed goes in front of them`,
			code: `@media screen and (color),  \fprojection and (color) {}`,
			fixed: `@media screen and (color),\n  \fprojection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `no newline after the comma`,
			code: `@media screen and (color),projection and (color) {}`,
			fixed: `@media screen and (color),\nprojection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `no newline after the comma, under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color),projection and (color) {}`,
			fixed: `@mEdIa screen and (color),\nprojection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `no newline after the comma, under an upper-case at-rule name`,
			code: `@MEDIA screen and (color),projection and (color) {}`,
			fixed: `@MEDIA screen and (color),\nprojection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a space after the comma`,
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color),\n projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `@media screen and (color),  projection and (color) {}`,
			fixed: `@media screen and (color),\n  projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `@media screen and (color),\tprojection and (color) {}`,
			fixed: `@media screen and (color),\n\tprojection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a space standing between the comma and the newline`,
			code: `@media screen and (color), \n\tprojection and (color) {}`,
			fixed: `@media screen and (color),\n\tprojection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `no newline after the comma, in a rule whose block breaks with a carriage return`,
			code: `@media screen and (color),projection and (color) {\r\n}`,
			fixed: `@media screen and (color),\r\nprojection and (color) {\r\n}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a space standing between the comma and a carriage-return line break`,
			code: `@media screen and (color), \r\n\tprojection and (color) {}`,
			fixed: `@media screen and (color),\r\n\tprojection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment right after the comma, and no newline anywhere behind it`,
			code: `@media screen and (color),/**/projection and (color) {}`,
			fixed: `@media screen and (color),/**/\nprojection and (color) {}`,
			line: 1,
			column: 30,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment and a space standing between the comma and the newline`,
			code: `@media screen and (color),/**/ \nprojection and (color) {}`,
			fixed: `@media screen and (color),/**/\nprojection and (color) {}`,
			line: 1,
			column: 30,
			message: messages.expectedAfter(),
		},
		{
			description: `two comments after the comma, with no newline behind them`,
			code: `@media screen and (color), /*comment1*/ /*comment2*/ projection and (color) {}`,
			fixed: `@media screen and (color), /*comment1*/ /*comment2*/\n projection and (color) {}`,
			line: 1,
			column: 52,
			message: messages.expectedAfter(),
		},
		{
			description: `tabs around two comments, the newline coming only after the second`,
			code: `@media screen and (color),\t/*comment1*/\t/*comment2*/ \nprojection and (color) {}`,
			fixed: `@media screen and (color),\t/*comment1*/\t/*comment2*/\nprojection and (color) {}`,
			line: 1,
			column: 52,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab and spaces after the comma, the comment falling on the next line`,
			code: `@media screen and (color),\t   \n/*comment*/\nprojection and (color) {}`,
			fixed: `@media screen and (color),\n/*comment*/\nprojection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			description: `three commas in a list of media types, none of them followed by a newline`,
			code: `@media tv,tv,tv,print {}`,
			fixed: `@media tv,\ntv,\ntv,\nprint {}`,
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
			fixed: `
				@media (min-width: url(http://x/y.png)),
				print { a { b: c; } }
			`,
			line: 1,
			column: 40,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line list in a single-line block`,
			code: `@media screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `a multi-line list written with a carriage-return line break`,
			code: `@media screen and (color),\r\nprojection and (color) {}`,
		},
		{
			description: `a multi-line list in a multi-line block`,
			code: `
				@media screen and (color),
				projection and (color) {
				}
			`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `@media screen and (color),projection and (color) {}`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `@media screen and (color),projection and (color) {\n}`,
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `@media screen and (color),projection and (color) {\r\n}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color),projection and (color),\nprint {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color),projection and (color),\nprint {}`,
		},
	],

	reject: [
		{
			description: `the first comma of a multi-line list, with no newline after it`,
			code: `@media screen and (color),projection and (color),\nprint {}`,
			fixed: `@media screen and (color),\nprojection and (color),\nprint {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color),projection and (color),\nprint {}`,
			fixed: `@mEdIa screen and (color),\nprojection and (color),\nprint {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color),projection and (color),\nprint {}`,
			fixed: `@MEDIA screen and (color),\nprojection and (color),\nprint {}`,
			line: 1,
			column: 26,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `
				@media screen and (color),projection and (color),
				print {
				}
			`,
			fixed: `
				@media screen and (color),
				projection and (color),
				print {
				}
			`,
			line: 1,
			column: 26,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `@media screen and (color),projection and (color),\r\nprint {\r\n}`,
			fixed: `@media screen and (color),\r\nprojection and (color),\r\nprint {\r\n}`,
			line: 1,
			column: 26,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a newline in front of the comma, which leaves nothing after it`,
			code: `@media screen and (color)\n,projection and (color) {}`,
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color)\n,projection and (color) {}`,
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color)\n,projection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color)\r\n,projection and (color) {}`,
		},
		{
			description: `the same list in a multi-line block`,
			code: `@media screen and (color)\n,projection and (color) {\n}`,
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `@media screen and (color)\r\n,projection and (color) {\r\n}`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `@media screen and (color), projection and (color) {\n}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color) ,projection and (color),\nprint {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color) ,projection and (color),\nprint {}`,
		},
	],

	reject: [
		{
			description: `a newline after the second comma of a multi-line list`,
			code: `@media screen and (color) ,projection and (color),\nprint {}`,
			fixed: `@media screen and (color) ,projection and (color),print {}`,
			line: 1,
			column: 50,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) ,projection and (color),\nprint {}`,
			fixed: `@mEdIa screen and (color) ,projection and (color),print {}`,
			line: 1,
			column: 50,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) ,projection and (color),\nprint {}`,
			fixed: `@MEDIA screen and (color) ,projection and (color),print {}`,
			line: 1,
			column: 50,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `
				@media screen and (color) ,projection and (color),
				print {
				}
			`,
			fixed: `
				@media screen and (color) ,projection and (color),print {
				}
			`,
			line: 1,
			column: 50,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `@media screen and (color) ,projection and (color),\r\nprint {\r\n}`,
			fixed: `@media screen and (color) ,projection and (color),print {\r\n}`,
			line: 1,
			column: 50,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a tab and a newline after the comma`,
			code: `@media screen and (color),\t\n projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a tab and a carriage-return line break after the comma`,
			code: `@media screen and (color),\t\r\n projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a comment standing on a line of its own after the comma`,
			code: `
				@media screen and (color),

				/**/
				projection and (color) {}
			`,
			fixed: `
				@media screen and (color),/**/
				projection and (color) {}
			`,
			line: 1,
			column: 26,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a comment after the comma and another on the line below`,
			code: `
				@media screen and (color), /*comment1*/
				/*comment2*/
				projection and (color) {}
			`,
			fixed: `
				@media screen and (color),/*comment1*/
				/*comment2*/
				projection and (color) {}
			`,
			line: 1,
			column: 26,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a list of media types broken after every comma`,
			code: `
				@media tv,
				tv,
				tv,
				print {
				}
			`,
			fixed: `
				@media tv,tv,tv,print {
				}
			`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejectedAfterMultiLine(),
				},
				{
					line: 2,
					column: 3,
					message: messages.rejectedAfterMultiLine(),
				},
				{
					line: 3,
					column: 3,
					message: messages.rejectedAfterMultiLine(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494
			description: `a vertical tab opening the run behind the comma, a word to the tokenizer: the break is written in front of it, instead of the fix taking the run for already broken and carrying the character off`,
			code: `@media a,\v\nb {}`,
			fixed: `@media a,\n\v\nb {}`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 10,
			message: messages.expectedAfter(),
		},
	],
})
