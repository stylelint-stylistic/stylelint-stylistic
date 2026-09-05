import { createRule } from "../../../../rules/function-parentheses-space-inside/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call standing in the text of an inline comment, opening and closing inside the line that comment runs to`,
			code: `a { t: foo(1px // c) calc( d); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `the same call with its arguments a line down, whose closing parenthesis the parser reads out of the code behind the comment`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a separator of Unicode, which no syntax reads a line in: the comment runs past it to the end of the value, and the parenthesis the parser closed the call on stands in its text`,
			code: `a { t: translate(1px, 2px // c\u2028 ); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a closing parenthesis written on the line an inline comment runs to, which is the parenthesis the parser closed the call on`,
			code: `
				a {
					transform: translate(1px,
					2px // keep me );
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call a line below an inline comment, gathered by one the parser opened inside that comment's text: the gathering call is left alone and the one it gathered is spaced where it stands`,
			code: `
				a { b: f(1px // c) calc(
					g( 2 )); }
			`,
			fixed: `
				a { b: f(1px // c) calc(
					g(2)); }
			`,
			warnings: [
				{
					line: 2,
					column: 4,
					message: messages.rejectedOpening,
				},
				{
					line: 2,
					column: 6,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/506
			description: `a \`/*/\` the value parser prints back one character longer than the file spells it: the parenthesis is still found where it stands`,
			code: `a { transform: translate(1px /*/ d */ 2px // keep me\n); }`,
			fixed: `a { transform: translate(1px /*/ d */ 2px // keep me\n); }`,
			line: 1,
			column: 53,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `a separator neither syntax ends a comment on: only the line feed behind it closes the comment, and taking that away would leave the parenthesis inside`,
			code: `a { transform: translate(1px, 2px // keep me\u2028\n); }`,
			fixed: `a { transform: translate(1px, 2px // keep me\u2028\n); }`,
			line: 1,
			column: 46,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `a separator the value parser counts as a word rather than as space: it survives the fix, so the line break it holds keeps the comment closed and the fix goes through`,
			code: `a { transform: translate(1px,\n2px // keep me\n\u2028 ); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\n\u2028); }`,
			line: 3,
			column: 2,
			message: messages.rejectedClosing,
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
		{
			description: `block comment behind the inline one: the parenthesis lands on its line, which the inline comment does not reach, so the fix goes through`,
			code: `
				a {
					transform: translate(1px, 2px // keep me
					/* and me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px // keep me
					/* and me */);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `block comment on the inline comment's own line, where the text of the inline one holds it`,
			code: `
				a {
					transform: translate(1px, 2px // keep me /* and me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px // keep me /* and me */
					);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			description: `block comment before the closing parenthesis: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					transform: translate(1px, 2px /* keep me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px /* keep me */);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			description: `whitespace holding no line break: the comment on the line above closes before the parenthesis, so the fix goes through`,
			code: `
				a {
					transform: translate(1px, // keep me
					2px  );
				}
			`,
			fixed: `
				a {
					transform: translate(1px, // keep me
					2px);
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedClosing,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
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
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, where the option would write its space`,
			code: `
				a { b: f(1px // c) calc(
				2px); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a separator of Unicode standing where the fix writes, which no syntax reads a line in: the comment runs past it to the end of the value, and the parenthesis the parser closed the call on stands in its text`,
			code: `a { t: translate( 1px, 2px // keep me\u2028); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `the other separator, read the same way as the first`,
			code: `a { t: translate( 1px, 2px // keep me\u2029); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a closing parenthesis written on the line an inline comment runs to, which is the parenthesis the parser closed the call on`,
			code: `
				a {
					transform: translate( 1px,
					2px // keep me);
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a call nested inside one the parser closed on a parenthesis standing in a comment: the walk goes on into it, and its own parentheses stand outside the comment and are spaced up; Less refuses the fixture, the closing brace standing in the comment as well, and there is no spelling of the shape it does not refuse`,
			code: `a { b: f(g(1) // c) 2px; }`,
			fixed: `a { b: f(g( 1 ) // c) 2px; }`,
			warnings: [
				{
					line: 1,
					column: 12,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 12,
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
	config: [`never-single-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `the separator under a single-line option, which the guard is asked under as well: a function whose only break is one no syntax reads a line in is single-line, and the comment holds the parenthesis the parser closed the call on`,
			code: `a { t: translate(1px, 2px // c\u2028 ); }`,
		},
	],
})
testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `the same separator under the option that would have written a space in its place`,
			code: `a { t: translate( 1px, 2px // c\u2028); }`,
		},
	],
})
