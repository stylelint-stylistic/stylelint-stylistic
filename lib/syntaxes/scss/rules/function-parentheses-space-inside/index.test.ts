import { createRule } from "../../../../rules/function-parentheses-space-inside/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call standing in the text of an inline comment, whose arguments the parser reads out of the code a line below`,
			code: `
				a {
					t: foo(1px // c) calc(
					2px);
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, whose space the option would take out of that text`,
			code: `
				a { b: f( 1px // c ) calc(
				2px ); }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call opened in the text of an inline comment and closed a line below it, whose arguments the parser reads across the break: the call in front of the comment is spaced up as ever, and the call opened inside that text is left alone on both its lines`,
			code: `
				a { b: f( 1 ) // g( 2
					3 ); }
			`,
			fixed: `
				a { b: f(1) // g( 2
					3 ); }
			`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 12,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					transform: translate(1px, 2px // keep me
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px // keep me
					);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosing,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a function the value parser marks unclosed, its closing parenthesis swallowed by a comment the file never closes, which is left alone warning and all`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call standing in the text of an inline comment, whose arguments the parser reads out of the code a line below`,
			code: `
				a {
					t: foo( 1px // c ) calc(
					2px );
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, and the call it read out of the code behind that comment: Sass compiles the value to one call reaching over the break, and neither parenthesis the parser hands back is one the file writes`,
			code: `a { b: f(1px // c) h(2px\n2px); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a closed call standing inside such a function, which is read and fixed where it stands`,
			code: `
				a {
					transform: translate(1px, calc(1 + 2) // a /*
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, calc( 1 + 2 ) // a /*
					);
				}
			`,
			warnings: [
				{
					line: 2,
					column: 33,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 37,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					transform: translate( 1px, 2px // keep me
					);
				}
			`,
			fixed: `
				a {
					transform: translate( 1px, 2px // keep me
					);
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedClosing,
		},
	],
})
testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `the same break under the option that would have written a space in its place`,
			code: `a { transform: translate( 1px, 2px// keep me\f ); }`,
		},
	],
})
