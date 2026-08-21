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
			description: `a newline in front of the comma`,
			code: `@media screen and (color)\n, projection and (color) {}`,
		},
		{
			description: `two newlines in front of the comma`,
			code: `@media screen and (color)\n\n, projection and (color) {}`,
		},
		{
			description: `a carriage return and a newline in front of the comma`,
			code: `@media screen and (color)\r\n, projection and (color) {}`,
		},
		{
			description: `two carriage-return line breaks in front of the comma`,
			code: `@media screen and (color)\r\n\r\n, projection and (color) {}`,
		},
		{
			description: `a newline and indentation in front of the comma`,
			code: `@media screen and (color)\n     ,  projection and (color) {}`,
		},
		{
			description: `a comma indented on a line of its own`,
			code: `@media screen and (color)\n\t\t,\nprojection and (color) {}`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `@media screen and (color)\r\n\t\t,\r\nprojection and (color) {}`,
		},
		{
			description: `a query list that carries no block`,
			code: `@media screen and (color)\n\n, projection and (color)`,
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
			code: `
				@media (min-width: url(http://x/y.png))
				,print { a { b: c; } }
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
			description: `no newline in front of the comma`,
			code: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `no newline in front of the comma, under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `no newline in front of the comma, under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `@media screen and (color)  , projection and (color) {}`,
			line: 1,
			column: 28,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `@media screen and (color)\t, projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)),print { a { b: c; } }`,
			line: 1,
			column: 40,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line list in a single-line block`,
			code: `@media screen and (color)\n, projection and (color) {}`,
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color)\n, projection and (color) {}`,
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color)\n, projection and (color) {}`,
		},
		{
			description: `a multi-line list written with a carriage-return line break`,
			code: `@media screen and (color)\r\n, projection and (color) {}`,
		},
		{
			description: `a multi-line list in a multi-line block`,
			code: `@media screen and (color)\n, projection and (color) {\n}`,
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
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color),projection and (color)\n, print {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color),projection and (color)\n, print {}`,
		},
	],

	reject: [
		{
			description: `the first comma of a multi-line list, with no newline in front of it`,
			code: `@media screen and (color),projection and (color)\n, print {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color),projection and (color)\n, print {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color),projection and (color)\n, print {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color),projection and (color)\r\n, print {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `@media screen and (color),projection and (color)\n, print {\n}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a newline after the comma, which leaves nothing in front of it`,
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
			description: `the same list in a multi-line block`,
			code: `
				@media screen and (color),
				projection and (color) {
				}
			`,
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `@media screen and (color),\r\nprojection and (color) {\r\n}`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `@media screen and (color) ,projection and (color) {}`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `@media screen and (color) ,projection and (color) {\n}`,
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
			description: `a space in front of the first comma of a multi-line list`,
			code: `@media screen and (color) ,projection and (color),\nprint {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) ,projection and (color),\nprint {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) ,projection and (color),\nprint {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `
				@media screen and (color) ,projection and (color),
				print {
				}
			`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `@media screen and (color) ,projection and (color),\r\nprint {\r\n}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
