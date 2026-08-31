import { createRule } from "../../../../rules/function-parentheses-newline-inside/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, whose whitespace the option would take out of that text`,
			code: `
				a { b: f( 1px // c ) calc(
				2px ); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a separator of Unicode, which no syntax reads a line in: the comment runs past it to the end of the value, and the parenthesis the parser closed the call on stands in its text`,
			code: `a { t: translate(1px,\n2px // c\u2028 ); }`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
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
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `block comment behind the inline one: the fix closes the whole run up, so the parenthesis would land in the inline comment all the same`,
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
					/* and me */
					);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
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
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `a slash of the value standing in front of a comment's own: closing the gap up would open a comment that was never there`,
			code: `
				a {
					width: calc(100%
					/ /* cols */);
				}
			`,
			fixed: `
				a {
					width: calc(100%
					/ /* cols */);
				}
			`,
			line: 3,
			column: 13,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `the same junction with a line break in the gap`,
			code: `
				a {
					width: calc(100%
					/ /* cols */
					);
				}
			`,
			fixed: `
				a {
					width: calc(100%
					/ /* cols */
					);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `comma ending the line the inline comment holds: the function keeps that line break in the comma, so the parenthesis lands on the block comment's line`,
			code: `
				a {
					transform: translate(1px, // keep me,
					/* and me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, // keep me,
					/* and me */);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `a \`/*/\` the value parser reads as a comment of its own and prints one character longer than the file spells it`,
			code: `
				a {
					transform: translate(1px // keep me
					/*/ /* and me */);
				}
			`,
			fixed: `
				a {
					transform: translate(1px // keep me
					/*/ /* and me */);
				}
			`,
			line: 3,
			column: 18,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `block comment standing alone: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					transform: translate(1px, 2px
					/* keep me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px/* keep me */);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosingMultiLine,
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
					transform: translate(1px, 2px/* keep me */);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosingMultiLine,
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
			message: messages.rejectedClosingMultiLine,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141
			description: `an inline comment stands between the opening parenthesis and the line break the option asks for`,
			code: `a { t: translate( // c\n  1px, 2px\n); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, and the call that text opens behind it: the break the option would write in front of that parenthesis is the break that closes the comment, so neither call is touched`,
			code: `
				a { t: foo(1px // c) calc(/*b*/
				 ,2px
				); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `the same shape without the block comment, which Less compiles to a single call of foo over two arguments: the break written in front of the parenthesis inside the comment used to close that comment and make two calls of the one`,
			code: `
				a { t: foo(1px // c) calc(
				2px); }
			`,
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141
			description: `an inline comment stands between the opening parenthesis and the line break the option asks for`,
			code: `a { t: translate( // c\n  1px, 2px\n); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an inline comment whose text opens a call the parser closes a line below, the break that closes the comment being the very break the option asks for`,
			code: `
				a {
					t: foo(// c(
						1px)
					);
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `the same two calls with the outer one already broken behind its opening parenthesis, which leaves the parenthesis inside the comment the only one the option asks a break in front of`,
			code: `
				a { t: foo(
				1px // c) calc(/*b*/
				 ,2px
				); }
			`,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141
			description: `an inline comment whose last character is a division sign, which the value parser hangs the closing break on`,
			code: `a { t: translate( // see MDN:\n  1px, 2px\n); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an inline comment whose text opens a call the parser closes a line below, the break that closes the comment being the very break the option asks for`,
			code: `
				a {
					t: foo(// c(
						1px)
					);
				}
			`,
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/129
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call standing in the text of an inline comment, whose arguments the parser reads out of the code a line below`,
			code: `a { t: foo(1px // c) calc(\n2px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `the same call with a space behind its opening parenthesis and a line break in front of its closing one`,
			code: `a { t: foo(1px // c) calc( 2px\n ); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call a line below an inline comment, gathered by one the parser opened inside that comment's text: the gathering call is left alone and the one it gathered is closed up where it stands`,
			code: `
				a { b: f(1px // c) calc(
					g(
					2px)); }
			`,
			fixed: `
				a { b: f(1px // c) calc(
					g(2px)); }
			`,
			line: 2,
			column: 4,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141
			description: `inline comment after the opening parenthesis: the first argument cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `a { t: translate(// c\n  1px, 2px); }`,
			fixed: `a { t: translate(// c\n  1px, 2px); }`,
			line: 1,
			column: 18,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/285
			description: `whitespace behind the parenthesis and whitespace behind an inline comment, of which the fix reaches only the first: the option cannot be satisfied by what it would write, so nothing is written and the problem is reported`,
			code: `a { t: translate( // c\n /*x*/\n , 1px); }`,
			fixed: `a { t: translate( // c\n /*x*/\n , 1px); }`,
			line: 1,
			column: 18,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an inline comment whose text opens a call the parser closes a line below: the whitespace behind the opening parenthesis is the break that closes the comment and the indentation behind it, and nothing of the code the parser filed under that call, and the fix reaches no stretch of it, so nothing is written and the problem is reported`,
			code: `
				a {
					t: foo(// c(
						1px));
				}
			`,
			fixed: `
				a {
					t: foo(// c(
						1px));
				}
			`,
			line: 2,
			column: 9,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `a quotation mark in the same place, opening a string the parser closes a line below, which is another node able to reach past the break`,
			code: `
				a {
					t: foo(// c"
						1px");
				}
			`,
			fixed: `
				a {
					t: foo(// c"
						1px");
				}
			`,
			line: 2,
			column: 9,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an unbalanced parenthesis in the text of a comment standing inside an address, which leaves the scan reading no address there and the parser handing the whole of what follows back as one word`,
			code: `
				a {
					t: url(// c(
						2px);
				}
			`,
			fixed: `
				a {
					t: url(// c(
						2px);
				}
			`,
			line: 2,
			column: 9,
			message: messages.rejectedOpeningMultiLine,
		},
	],
})
