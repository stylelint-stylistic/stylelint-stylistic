import { createRule } from "../../../../rules/function-parentheses-newline-inside/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

const VERTICAL_TAB = String.fromCodePoint(0x0b)

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// See #131
			description: `a function the value parser marks unclosed, where the whitespace this option counts stands inside the text of the comment rather than in front of the parenthesis`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
	],

	reject: [
		{
			// See #113
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
			// See #303
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
			// See #505
			description: `an end-of-line comment standing behind two block comments, whose whitespace is read on both sides of it: the run behind it is the break that closes it, which no fix may take, so nothing is written and the problem is reported`,
			code: `a { b: f(/** c */ /** e */ // d\n 2); }`,
			fixed: `a { b: f(/** c */ /** e */ // d\n 2); }`,
			line: 1,
			column: 10,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// See #505 and #496
			description: `a vertical tab standing between the two comments, which the value parser calls whitespace and the tokenizer a word: the run in front of it is emptied and the character itself is left where it stands`,
			code: `a { b: f(/*b*/ ${VERTICAL_TAB} //c\n ); }`,
			fixed: `a { b: f(/*b*/${VERTICAL_TAB} //c\n ); }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 2,
					column: 1,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			// See #505
			description: `a call holding a block comment and an end-of-line comment behind it: the run between the two is emptied, while the run in front of the closing parenthesis is the break that closes the comment and stays`,
			code: `a { b: f(/*b*/ //c\n ); }`,
			fixed: `a { b: f(/*b*///c\n ); }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 2,
					column: 1,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// See #131
			description: `a function the value parser marks unclosed, its closing parenthesis swallowed by a comment the file never closes, which is left alone warning and all`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
		{
			// See #320
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, and the call that text opens behind it: the break the option would write in front of that parenthesis is the break that closes the comment, so neither call is touched`,
			code: `
				a { t: foo(1px // c) calc(/*b*/
				 ,2px
				); }
			`,
		},
		{
			// See #320
			description: `the same two parentheses with ordinary code behind the comment rather than a block comment: Sass compiles the value to one call reaching over the break, and the break the option would write would close the comment and make two calls of it`,
			code: `a { b: f(1px // c) h(2px\n2px); }`,
		},
		{
			// See #505
			description: `an end-of-line comment standing behind a block comment, the break that closes it standing where the option asks for one`,
			code: `a { b: f(/** c */ // d\n 2\n); }`,
		},
		{
			// See #505
			description: `two end-of-line comments in a row, the break that closes the first standing where the option asks for one`,
			code: `a { b: f(// a\n // b\n 2\n); }`,
		},
		{
			// See #505
			description: `the same two comments with a space in front of the first one's break, which puts the start of the second one's node inside the first one's text: the node is placed by that start, and the run behind the comment it reaches past is the value's`,
			code: `a { b: f(//c \n //d\n 2\n); }`,
		},
	],

	reject: [
		{
			// See #131
			description: `a closed call standing inside such a function, which is read and fixed where it stands`,
			code: `
				a {
					transform: translate(1px, calc(1 + 2) // a /*
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, calc(
				1 + 2
				) // a /*
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
			// See #505
			description: `a call holding nothing but a block comment and an end-of-line comment behind it, where the break goes into the run in front of the second one so that the first keeps its line`,
			code: `a { b: f(/*b*/ //c\n); }`,
			fixed: `a { b: f(/*b*/\n //c\n); }`,
			line: 1,
			column: 10,
			message: messages.expectedOpening,
		},
		{
			// See #505 and #496
			description: `a vertical tab standing between the two comments, which the value parser calls whitespace and the tokenizer a word: the run beside the parenthesis ends at that character and holds no break, so the option asks for one`,
			code: `a { b: f(/*b*/ ${VERTICAL_TAB} //c\n 2\n); }`,
			fixed: `a { b: f(/*b*/\n ${VERTICAL_TAB} //c\n 2\n); }`,
			line: 1,
			column: 10,
			message: messages.expectedOpening,
		},
		{
			// See #505
			description: `a division sign of the value standing behind an end-of-line comment that ends on a space: the node it opens begins inside the comment's text, so the break behind that comment is read and the opening parenthesis is left alone`,
			code: `a { b: f(//c \n /); }`,
			fixed: `a { b: f(//c \n /\n); }`,
			line: 2,
			column: 2,
			message: messages.expectedClosing,
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// See #131
			description: `a function the value parser marks unclosed, its closing parenthesis swallowed by a comment the file never closes, which the issue names under this option as well`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
		{
			// See #320
			description: `the same two calls with the outer one already broken behind its opening parenthesis, which leaves the parenthesis inside the comment the only one the option asks a break in front of`,
			code: `
				a { t: foo(
				1px // c) calc(/*b*/
				 ,2px
				); }
			`,
		},
		{
			// See #505
			description: `an end-of-line comment standing behind a block comment in a multi-line call, the break that closes it standing where the option asks for one`,
			code: `a { b: f(/** c */ // d\n 2\n); }`,
		},
	],
})
