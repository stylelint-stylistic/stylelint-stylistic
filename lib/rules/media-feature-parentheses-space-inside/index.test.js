import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@media ( max-width: 300px ) {}`,
			description: `a space inside each parenthesis of a single feature`,
		},
		{
			code: `@mEdIa ( max-width: 300px ) {}`,
			description: `the same query under a mixed-case at-rule name`,
		},
		{
			code: `@MEDIA ( max-width: 300px ) {}`,
			description: `the same query under an upper-case at-rule name`,
		},
		{
			code: `@media screen and ( color ), projection and ( color ) {}`,
			description: `spaces inside the parentheses of both features of a query list`,
		},
		{
			code: `@media ( grid ) and ( max-width: 15em ) {}`,
			description: `spaces inside the parentheses of two features joined by and`,
		},
		{
			code: `@media ( max-width: /*comment*/ ) {}`,
			description: `a comment standing where the value would be, the spaces still in place`,
		},
	],

	reject: [
		{
			code: `@media (max-width: 300px ) {}`,
			fixed: `@media ( max-width: 300px ) {}`,
			description: `no space after the opening parenthesis`,
			message: messages.expectedOpening,
			line: 1,
			column: 9,
		},
		{
			code: `@mEdIa (max-width: 300px ) {}`,
			fixed: `@mEdIa ( max-width: 300px ) {}`,
			description: `no space after the opening parenthesis, under a mixed-case at-rule name`,
			message: messages.expectedOpening,
			line: 1,
			column: 9,
		},
		{
			code: `@MEDIA (max-width: /*comment*/ ) {}`,
			fixed: `@MEDIA ( max-width: /*comment*/ ) {}`,
			description: `no space after the opening parenthesis of a feature whose value is a comment`,
			message: messages.expectedOpening,
			line: 1,
			column: 9,
		},
		{
			code: `@MEDIA (max-width: 300px ) {}`,
			fixed: `@MEDIA ( max-width: 300px ) {}`,
			description: `no space after the opening parenthesis, under an upper-case at-rule name`,
			message: messages.expectedOpening,
			line: 1,
			column: 9,
		},
		{
			code: `@media ( max-width: 300px) {}`,
			fixed: `@media ( max-width: 300px ) {}`,
			description: `no space before the closing parenthesis`,
			message: messages.expectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `@media ( max-width: /*comment*/) {}`,
			fixed: `@media ( max-width: /*comment*/ ) {}`,
			description: `no space before the closing parenthesis of a feature whose value is a comment`,
			message: messages.expectedClosing,
			line: 1,
			column: 31,
		},
		{
			code: `@media screen and (color ), projection and ( color ) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			description: `no space after the opening parenthesis of the first feature of a query list`,
			message: messages.expectedOpening,
			line: 1,
			column: 20,
		},
		{
			code: `@media screen and ( color), projection and ( color ) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			description: `no space before the closing parenthesis of the first feature of a query list`,
			message: messages.expectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `@media screen and ( color ), projection and (color ) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			description: `no space after the opening parenthesis of the second feature of a query list`,
			message: messages.expectedOpening,
			line: 1,
			column: 46,
		},
		{
			code: `@media screen and ( color ), projection and ( color) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			description: `no space before the closing parenthesis of the second feature of a query list`,
			message: messages.expectedClosing,
			line: 1,
			column: 51,
		},
		{
			code: `@media ( grid ) and (max-width: 15em ) {}`,
			fixed: `@media ( grid ) and ( max-width: 15em ) {}`,
			description: `no space after the opening parenthesis of the second of two features joined by and`,
			message: messages.expectedOpening,
			line: 1,
			column: 22,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `@media (max-width: 300px) {}`,
			description: `no space inside either parenthesis`,
		},
		{
			code: `@mEdIa (max-width: 300px) {}`,
			description: `the same query under a mixed-case at-rule name`,
		},
		{
			code: `@MEDIA (max-width: 300px) {}`,
			description: `the same query under an upper-case at-rule name`,
		},
		{
			code: `@MEDIA (max-width: /*comment*/) {}`,
			description: `a comment standing where the value would be, with no spaces around it`,
		},
		{
			code: `@media screen and (color), projection and (color) {}`,
			description: `a query list with no spaces inside any parenthesis`,
		},
		{
			code: `@media (grid) and (max-width: 15em) {}`,
			description: `two features joined by and, with no spaces inside their parentheses`,
		},
	],

	reject: [
		{
			code: `@media (  min-width: 700px) {}`,
			fixed: `@media (min-width: 700px) {}`,
			description: `two spaces after the opening parenthesis`,
			message: messages.rejectedOpening,
			line: 1,
			column: 9,
		},
		{
			code: `@media (min-width: 700px  ) {}`,
			fixed: `@media (min-width: 700px) {}`,
			description: `two spaces before the closing parenthesis`,
			message: messages.rejectedClosing,
			line: 1,
			column: 26,
		},
		{
			code: `@media (\t  min-width: 700px) {}`,
			fixed: `@media (min-width: 700px) {}`,
			description: `a tab and a space after the opening parenthesis`,
			message: messages.rejectedOpening,
			line: 1,
			column: 9,
		},
		{
			code: `@media (min-width: 700px\t) {}`,
			fixed: `@media (min-width: 700px) {}`,
			description: `a tab before the closing parenthesis`,
			message: messages.rejectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `@media (max-width: 300px ) {}`,
			fixed: `@media (max-width: 300px) {}`,
			description: `a space before the closing parenthesis`,
			message: messages.rejectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `@mEdIa (max-width: 300px ) {}`,
			fixed: `@mEdIa (max-width: 300px) {}`,
			description: `a space before the closing parenthesis, under a mixed-case at-rule name`,
			message: messages.rejectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `@MEDIA (max-width: /*comment*/ ) {}`,
			fixed: `@MEDIA (max-width: /*comment*/) {}`,
			description: `a space before the closing parenthesis of a feature whose value is a comment`,
			message: messages.rejectedClosing,
			line: 1,
			column: 31,
		},
		{
			code: `@MEDIA (max-width: 300px ) {}`,
			fixed: `@MEDIA (max-width: 300px) {}`,
			description: `a space before the closing parenthesis, under an upper-case at-rule name`,
			message: messages.rejectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `@media ( max-width: 300px) {}`,
			fixed: `@media (max-width: 300px) {}`,
			description: `a space after the opening parenthesis`,
			message: messages.rejectedOpening,
			line: 1,
			column: 9,
		},
		{
			code: `@media ( max-width: /*comment*/) {}`,
			fixed: `@media (max-width: /*comment*/) {}`,
			description: `a space after the opening parenthesis of a feature whose value is a comment`,
			message: messages.rejectedOpening,
			line: 1,
			column: 9,
		},
		{
			code: `@media screen and (color ), projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a space before the closing parenthesis of the first feature of a query list`,
			message: messages.rejectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `@media screen and ( color), projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a space after the opening parenthesis of the first feature of a query list`,
			message: messages.rejectedOpening,
			line: 1,
			column: 20,
		},
		{
			code: `@media screen and (color), projection and (color ) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a space before the closing parenthesis of the second feature of a query list`,
			message: messages.rejectedClosing,
			line: 1,
			column: 49,
		},
		{
			code: `@media screen and (color), projection and ( color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			description: `a space after the opening parenthesis of the second feature of a query list`,
			message: messages.rejectedOpening,
			line: 1,
			column: 44,
		},
		{
			code: `@media (grid) and (max-width: 15em ) {}`,
			fixed: `@media (grid) and (max-width: 15em) {}`,
			description: `a space before the closing parenthesis of the second of two features joined by and`,
			message: messages.rejectedClosing,
			line: 1,
			column: 35,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash, so the feature behind it is read`,
			code: `@media (myurl(//a)) and ( min-width:1px ) { c {} }`,
			fixed: `@media (myurl(//a)) and (min-width:1px) { c {} }`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 26,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 40,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/138
			description: `a parenthesis inside the text of an inline comment opens no media feature`,
			code: `
				@media ( min-width: 100px ) and // (z
				( max-width: 200px ) { a { color: red; } }
			`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/138
			description: `a parenthesis inside the text of an inline comment opens no media feature`,
			code: `
				@media (min-width: 100px) and // ( z
				(max-width: 200px) { a { color: red; } }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/138
			description: `the fix reaches the features of the query and leaves the text of the comment as it stands`,
			code: `
				@media ( min-width: 100px ) and // ( z
				(max-width: 200px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 100px) and // ( z
				(max-width: 200px) { a { color: red; } }
			`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 9,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 26,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/152
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the parameters are left alone and the warning stands`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
			message: messages.rejectedClosing,
			line: 2,
			column: 1,
		},
	],
})
