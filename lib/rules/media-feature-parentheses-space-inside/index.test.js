import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space inside each parenthesis of a single feature`,
			code: `@media ( max-width: 300px ) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa ( max-width: 300px ) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA ( max-width: 300px ) {}`,
		},
		{
			description: `spaces inside the parentheses of both features of a query list`,
			code: `@media screen and ( color ), projection and ( color ) {}`,
		},
		{
			description: `spaces inside the parentheses of two features joined by and`,
			code: `@media ( grid ) and ( max-width: 15em ) {}`,
		},
		{
			description: `a comment standing where the value would be, the spaces still in place`,
			code: `@media ( max-width: /*comment*/ ) {}`,
		},
	],

	reject: [
		{
			description: `no space after the opening parenthesis`,
			code: `@media (max-width: 300px ) {}`,
			fixed: `@media ( max-width: 300px ) {}`,
			line: 1,
			column: 9,
			message: messages.expectedOpening,
		},
		{
			description: `no space after the opening parenthesis, under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 300px ) {}`,
			fixed: `@mEdIa ( max-width: 300px ) {}`,
			line: 1,
			column: 9,
			message: messages.expectedOpening,
		},
		{
			description: `no space after the opening parenthesis of a feature whose value is a comment`,
			code: `@MEDIA (max-width: /*comment*/ ) {}`,
			fixed: `@MEDIA ( max-width: /*comment*/ ) {}`,
			line: 1,
			column: 9,
			message: messages.expectedOpening,
		},
		{
			description: `no space after the opening parenthesis, under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 300px ) {}`,
			fixed: `@MEDIA ( max-width: 300px ) {}`,
			line: 1,
			column: 9,
			message: messages.expectedOpening,
		},
		{
			description: `no space before the closing parenthesis`,
			code: `@media ( max-width: 300px) {}`,
			fixed: `@media ( max-width: 300px ) {}`,
			line: 1,
			column: 25,
			message: messages.expectedClosing,
		},
		{
			description: `no space before the closing parenthesis of a feature whose value is a comment`,
			code: `@media ( max-width: /*comment*/) {}`,
			fixed: `@media ( max-width: /*comment*/ ) {}`,
			line: 1,
			column: 31,
			message: messages.expectedClosing,
		},
		{
			description: `no space after the opening parenthesis of the first feature of a query list`,
			code: `@media screen and (color ), projection and ( color ) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			line: 1,
			column: 20,
			message: messages.expectedOpening,
		},
		{
			description: `no space before the closing parenthesis of the first feature of a query list`,
			code: `@media screen and ( color), projection and ( color ) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			line: 1,
			column: 25,
			message: messages.expectedClosing,
		},
		{
			description: `no space after the opening parenthesis of the second feature of a query list`,
			code: `@media screen and ( color ), projection and (color ) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			line: 1,
			column: 46,
			message: messages.expectedOpening,
		},
		{
			description: `no space before the closing parenthesis of the second feature of a query list`,
			code: `@media screen and ( color ), projection and ( color) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			line: 1,
			column: 51,
			message: messages.expectedClosing,
		},
		{
			description: `no space after the opening parenthesis of the second of two features joined by and`,
			code: `@media ( grid ) and (max-width: 15em ) {}`,
			fixed: `@media ( grid ) and ( max-width: 15em ) {}`,
			line: 1,
			column: 22,
			message: messages.expectedOpening,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `no space inside either parenthesis`,
			code: `@media (max-width: 300px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 300px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 300px) {}`,
		},
		{
			description: `a comment standing where the value would be, with no spaces around it`,
			code: `@MEDIA (max-width: /*comment*/) {}`,
		},
		{
			description: `a query list with no spaces inside any parenthesis`,
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			description: `two features joined by and, with no spaces inside their parentheses`,
			code: `@media (grid) and (max-width: 15em) {}`,
		},
	],

	reject: [
		{
			description: `two spaces after the opening parenthesis`,
			code: `@media (  min-width: 700px) {}`,
			fixed: `@media (min-width: 700px) {}`,
			line: 1,
			column: 9,
			message: messages.rejectedOpening,
		},
		{
			description: `two spaces before the closing parenthesis`,
			code: `@media (min-width: 700px  ) {}`,
			fixed: `@media (min-width: 700px) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedClosing,
		},
		{
			description: `a tab and a space after the opening parenthesis`,
			code: `@media (\t  min-width: 700px) {}`,
			fixed: `@media (min-width: 700px) {}`,
			line: 1,
			column: 9,
			message: messages.rejectedOpening,
		},
		{
			description: `a tab before the closing parenthesis`,
			code: `@media (min-width: 700px\t) {}`,
			fixed: `@media (min-width: 700px) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space before the closing parenthesis`,
			code: `@media (max-width: 300px ) {}`,
			fixed: `@media (max-width: 300px) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space before the closing parenthesis, under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 300px ) {}`,
			fixed: `@mEdIa (max-width: 300px) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space before the closing parenthesis of a feature whose value is a comment`,
			code: `@MEDIA (max-width: /*comment*/ ) {}`,
			fixed: `@MEDIA (max-width: /*comment*/) {}`,
			line: 1,
			column: 31,
			message: messages.rejectedClosing,
		},
		{
			description: `a space before the closing parenthesis, under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 300px ) {}`,
			fixed: `@MEDIA (max-width: 300px) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space after the opening parenthesis`,
			code: `@media ( max-width: 300px) {}`,
			fixed: `@media (max-width: 300px) {}`,
			line: 1,
			column: 9,
			message: messages.rejectedOpening,
		},
		{
			description: `a space after the opening parenthesis of a feature whose value is a comment`,
			code: `@media ( max-width: /*comment*/) {}`,
			fixed: `@media (max-width: /*comment*/) {}`,
			line: 1,
			column: 9,
			message: messages.rejectedOpening,
		},
		{
			description: `a space before the closing parenthesis of the first feature of a query list`,
			code: `@media screen and (color ), projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space after the opening parenthesis of the first feature of a query list`,
			code: `@media screen and ( color), projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 20,
			message: messages.rejectedOpening,
		},
		{
			description: `a space before the closing parenthesis of the second feature of a query list`,
			code: `@media screen and (color), projection and (color ) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 49,
			message: messages.rejectedClosing,
		},
		{
			description: `a space after the opening parenthesis of the second feature of a query list`,
			code: `@media screen and (color), projection and ( color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 44,
			message: messages.rejectedOpening,
		},
		{
			description: `a space before the closing parenthesis of the second of two features joined by and`,
			code: `@media (grid) and (max-width: 15em ) {}`,
			fixed: `@media (grid) and (max-width: 15em) {}`,
			line: 1,
			column: 35,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash, so the feature behind it is read`,
			code: `@media (myurl(//a)) and ( min-width:1px ) { c {} }`,
			fixed: `@media (myurl(//a)) and (min-width:1px) { c {} }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 40,
					message: messages.rejectedClosing,
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
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 26,
					message: messages.rejectedClosing,
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
			line: 2,
			column: 1,
			message: messages.rejectedClosing,
		},
	],
})
